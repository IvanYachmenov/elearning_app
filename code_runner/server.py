import json
import os
import resource
import subprocess
import sys
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


HOST = "0.0.0.0"
PORT = int(os.getenv("PORT", "8080"))
MAX_CODE_LENGTH = 20000
MAX_STREAM_LENGTH = 20000
DEFAULT_TIMEOUT_SECONDS = 3
MAX_TIMEOUT_SECONDS = 5
MEMORY_LIMIT_BYTES = 128 * 1024 * 1024


def limit_child_resources():
    resource.setrlimit(resource.RLIMIT_CPU, (MAX_TIMEOUT_SECONDS, MAX_TIMEOUT_SECONDS))
    resource.setrlimit(resource.RLIMIT_AS, (MEMORY_LIMIT_BYTES, MEMORY_LIMIT_BYTES))
    resource.setrlimit(resource.RLIMIT_FSIZE, (1024 * 1024, 1024 * 1024))
    if hasattr(resource, "RLIMIT_NPROC"):
        resource.setrlimit(resource.RLIMIT_NPROC, (32, 32))


def clamp_timeout(value):
    try:
        timeout = int(value)
    except (TypeError, ValueError):
        return DEFAULT_TIMEOUT_SECONDS
    return max(1, min(timeout, MAX_TIMEOUT_SECONDS))


def truncate_stream(value):
    if len(value) <= MAX_STREAM_LENGTH:
        return value
    return value[:MAX_STREAM_LENGTH] + "\n[output truncated]"


def run_python(payload):
    code = payload.get("code")
    if not isinstance(code, str):
        return 400, {"detail": "code must be a string"}
    if len(code) > MAX_CODE_LENGTH:
        return 400, {"detail": "code is too long"}

    stdin = payload.get("stdin", "")
    if not isinstance(stdin, str):
        return 400, {"detail": "stdin must be a string"}

    timeout_seconds = clamp_timeout(payload.get("timeout_seconds"))

    with tempfile.TemporaryDirectory(dir="/tmp") as tmpdir:
        script_path = Path(tmpdir) / "main.py"
        script_path.write_text(code, encoding="utf-8")

        try:
            completed = subprocess.run(
                [sys.executable, "-I", str(script_path)],
                input=stdin,
                text=True,
                capture_output=True,
                cwd=tmpdir,
                timeout=timeout_seconds,
                env={
                    "PYTHONIOENCODING": "utf-8",
                    "PYTHONDONTWRITEBYTECODE": "1",
                },
                preexec_fn=limit_child_resources,
            )
        except subprocess.TimeoutExpired as error:
            return 200, {
                "status": "timeout",
                "stdout": truncate_stream(error.stdout or ""),
                "stderr": truncate_stream(error.stderr or ""),
                "exit_code": None,
                "timed_out": True,
            }

    return 200, {
        "status": "completed" if completed.returncode == 0 else "runtime_error",
        "stdout": truncate_stream(completed.stdout or ""),
        "stderr": truncate_stream(completed.stderr or ""),
        "exit_code": completed.returncode,
        "timed_out": False,
    }


class RunnerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.respond(200, {"status": "ok"})
            return
        self.respond(404, {"detail": "Not found"})

    def do_POST(self):
        if self.path != "/run":
            self.respond(404, {"detail": "Not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.respond(400, {"detail": "Invalid Content-Length"})
            return

        if length <= 0:
            self.respond(400, {"detail": "Empty request body"})
            return
        if length > 64 * 1024:
            self.respond(413, {"detail": "Request body too large"})
            return

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            self.respond(400, {"detail": "Invalid JSON"})
            return

        if payload.get("language") != "python":
            self.respond(400, {"detail": "Only Python is supported"})
            return

        status_code, response = run_python(payload)
        self.respond(status_code, response)

    def respond(self, status_code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), RunnerHandler)
    print(f"code_runner listening on {HOST}:{PORT}", flush=True)
    server.serve_forever()

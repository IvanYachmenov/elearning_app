import json
import urllib.error
import urllib.request

from django.conf import settings


class CodeRunnerError(Exception):
    pass


def run_python_code(code: str, timeout_seconds: int = 3) -> dict:
    payload = json.dumps(
        {
            "language": "python",
            "code": code,
            "stdin": "",
            "timeout_seconds": timeout_seconds,
        }
    ).encode("utf-8")

    url = f"{settings.CODE_RUNNER_URL.rstrip('/')}/run"
    request = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds + 2) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        try:
            error_payload = json.loads(error.read().decode("utf-8"))
            detail = error_payload.get("detail") or error_payload.get("error")
        except Exception:
            detail = None
        raise CodeRunnerError(detail or "Code runner rejected the request.") from error
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise CodeRunnerError("Code runner is unavailable.") from error

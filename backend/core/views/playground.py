from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..services.code_runner import CodeRunnerError, run_python_code

MAX_CODE_LENGTH = 20000


# POST /api/playground/run/
class PlaygroundRunView(APIView):
    """Run a free-form snippet in the playground (Python only for now)."""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_scope = "code"

    def post(self, request):
        language = str(request.data.get("language", "python")).strip().lower()
        code = request.data.get("code", "")

        if not isinstance(code, str):
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)
        if len(code) > MAX_CODE_LENGTH:
            return Response({"detail": "Code is too long."}, status=status.HTTP_400_BAD_REQUEST)
        if language != "python":
            return Response(
                {"detail": "Only Python is supported for now. JavaScript is coming soon."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            run_result = run_python_code(code)
        except CodeRunnerError as error:
            return Response({"detail": str(error)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({
            "status": run_result.get("status", "error"),
            "stdout": run_result.get("stdout", ""),
            "stderr": run_result.get("stderr", ""),
            "exit_code": run_result.get("exit_code"),
            "timed_out": bool(run_result.get("timed_out")),
        })

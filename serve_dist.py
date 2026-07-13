from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parent / "dist"


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and "." not in Path(self.path).name:
            self.path = "/index.html"
        return super().send_head()


class DualStackServer(ThreadingHTTPServer):
    address_family = __import__("socket").AF_INET6
    daemon_threads = True


if __name__ == "__main__":
    server = DualStackServer(("::", 3000), SpaHandler)
    print("ATMOS frontend en http://localhost:3000/")
    server.serve_forever()

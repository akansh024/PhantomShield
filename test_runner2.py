import subprocess
import codecs

with codecs.open('pytest_out.txt', 'w', 'utf-8') as f:
    subprocess.run(["venv\\Scripts\\python.exe", "-m", "pytest", "app/tests/", "-v", "--tb=short"], stdout=f, stderr=subprocess.STDOUT)

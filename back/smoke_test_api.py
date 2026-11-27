"""
Verificações estáticas da integração Frontend <-> FastAPI.
Não substitui o teste com Docker/PostgreSQL, mas detecta contratos quebrados
antes de subir o ambiente.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
MAIN = (ROOT / "Main.py").read_text(encoding="utf-8")
AUTH = (ROOT / "Auth.py").read_text(encoding="utf-8")
FUNCIONARIO = (ROOT / "Funcionario.py").read_text(encoding="utf-8")
SECURITY = (ROOT / "Security.py").read_text(encoding="utf-8")
SCHEMA = (ROOT / "DataBaseSchema.py").read_text(encoding="utf-8")
COMPOSE = (ROOT / "../docker-compose.yml").read_text(encoding="utf-8")

FRONT_SRC = ROOT / "../front/supermercado/src"
REPO = (FRONT_SRC / "services/repositories.ts").read_text(encoding="utf-8")
AUTH_SVC = (FRONT_SRC / "services/AuthService.ts").read_text(encoding="utf-8")
FUNC_SVC = (FRONT_SRC / "services/FuncionarioService.ts").read_text(encoding="utf-8")
CADASTROS = (FRONT_SRC / "pages/CadastrosPage.tsx").read_text(encoding="utf-8")
LOGS = (FRONT_SRC / "pages/LogPage.tsx").read_text(encoding="utf-8")
FUNC_PAGE = (FRONT_SRC / "pages/FuncionariosPage.tsx").read_text(encoding="utf-8")
SIDEBAR = (FRONT_SRC / "components/Sidebar.tsx").read_text(encoding="utf-8")
APP = (FRONT_SRC / "App.tsx").read_text(encoding="utf-8")

expected_main = [
    ("GET /categorias", r'@app\.get\("/categorias"'),
    ("POST /categorias", r'@app\.post\("/categorias"'),
    ("DELETE /categorias/{id}", r'@app\.delete\("/categorias/\{categoria_id\}"'),
    ("GET /fornecedores", r'@app\.get\("/fornecedores"'),
    ("POST /fornecedores", r'@app\.post\("/fornecedores"'),
    ("DELETE /fornecedores/{id}", r'@app\.delete\("/fornecedores/\{fornecedor_id\}"'),
    ("GET /lotes", r'@app\.get\("/lotes"'),
    ("POST /lotes", r'@app\.post\("/lotes"'),
    ("GET /produtos", r'@app\.get\("/produtos"'),
    ("GET /produtos/{id}", r'@app\.get\("/produtos/\{produto_id\}"'),
    ("POST /produtos", r'@app\.post\("/produtos"'),
    ("PUT /produtos/{id}", r'@app\.put\("/produtos/\{produto_id\}"'),
    ("PATCH /produtos/{id}", r'@app\.patch\("/produtos/\{produto_id\}"'),
    ("DELETE /produtos/{id}", r'@app\.delete\("/produtos/\{produto_id\}"'),
    ("GET /alertas/estoque", r'@app\.get\("/alertas/estoque"'),
    ("GET /logs", r'@app\.get\("/logs"'),
]
for name, pattern in expected_main:
    assert re.search(pattern, MAIN), f"FALHOU: {name}"

# Garante que todas as rotas de negócio exigem autenticação/autorização JWT
assert MAIN.count("Depends(get_usuario_atual)") >= 15, "FALHOU: rotas de negócio sem get_usuario_atual"
assert "Depends(verificar_admin)" in MAIN, "FALHOU: /logs sem verificar_admin"
assert '@router.post("/login"' in AUTH, "FALHOU: POST /auth/login"
assert '@router.get("/me"' in AUTH, "FALHOU: GET /auth/me"
assert 'prefix="/funcionarios"' in FUNCIONARIO, "FALHOU: router /funcionarios"
assert FUNCIONARIO.count("Depends(verificar_admin)") >= 5, "FALHOU: /funcionarios sem verificar_admin"
assert "jwt.decode" in SECURITY and "HTTPBearer" in SECURITY, "FALHOU: validação JWT"

for path in ["/produtos", "/categorias"]:
    assert path in REPO, f"FALHOU contrato do frontend: {path}"

assert "VITE_USE_MOCK=false" in COMPOSE, "Docker ainda está usando Mock"
assert "JWT_SECRET_KEY" in COMPOSE, "Docker sem JWT_SECRET_KEY"
assert "class Funcionario(Base):" in SCHEMA and "class Cargo(PyEnum):" in SCHEMA
assert 'movimentacoes = relationship("Movimentacao", back_populates="lote"' in SCHEMA
assert "fornecedor_id = Column(Integer, ForeignKey('fornecedores.id'), nullable=False)" in SCHEMA
assert "fornecedor_id: int = Field(gt=0)" in MAIN
assert "pg_get_serial_sequence('fornecedores', 'id')" in MAIN

# Garante que o frontend usa apiRequest autenticado em todas as páginas/serviços
assert "apiRequest" in REPO, "repositories.ts sem apiRequest autenticado"
assert "apiRequest" in CADASTROS, "CadastrosPage.tsx sem apiRequest autenticado"
assert "apiRequest" in LOGS, "LogPage.tsx sem apiRequest autenticado"
assert "apiRequest" in FUNC_SVC, "FuncionarioService.ts sem apiRequest autenticado"
assert "Authorization" in AUTH_SVC, "AuthService.ts sem header Authorization"
assert "request<void>(`/categorias/${item.id}`" in CADASTROS
assert "request<void>(`/fornecedores/${item.id}`" in CADASTROS
assert "/funcionarios" in SIDEBAR and "/logs" in SIDEBAR and "apenasAdmin" in SIDEBAR
assert "RotaAdmin" in APP and "FuncionariosPage" in APP and "listarFuncionarios" in FUNC_PAGE

print("OK: contratos de API, JWT, Funcionarios, Repository e Docker conferidos.")

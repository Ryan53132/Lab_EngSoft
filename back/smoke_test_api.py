"""
Verificações estáticas da integração Frontend <-> FastAPI.
Não substitui o teste com Docker/PostgreSQL, mas detecta contratos quebrados
antes de subir o ambiente.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
MAIN = (ROOT / "Main.py").read_text(encoding="utf-8")
REPO = (ROOT / "../front/supermercado/src/services/repositories.ts").read_text(encoding="utf-8")
CADASTROS = (ROOT / "../front/supermercado/src/pages/CadastrosPage.tsx").read_text(encoding="utf-8")
COMPOSE = (ROOT / "../docker-compose.yml").read_text(encoding="utf-8")
SCHEMA = (ROOT / "DataBaseSchema.py").read_text(encoding="utf-8")

expected = [
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
]
for name, pattern in expected:
    assert re.search(pattern, MAIN), f"FALHOU: {name}"

for path in ["/produtos", "/categorias"]:
    assert path in REPO, f"FALHOU contrato do frontend: {path}"

assert "VITE_USE_MOCK=false" in COMPOSE, "Docker ainda está usando Mock"
assert 'movimentacoes = relationship("Movimentacao", back_populates="lote"' in SCHEMA
assert "fornecedor_id = Column(Integer, ForeignKey('fornecedores.id'), nullable=False)" in SCHEMA
assert "fornecedor_id: int = Field(gt=0)" in MAIN
assert "pg_get_serial_sequence('fornecedores', 'id')" in MAIN
assert "fornecedor_id: Number(lote.fornecedor_id)" in CADASTROS
assert "request<void>(`/categorias/${item.id}`" in CADASTROS
assert "request<void>(`/fornecedores/${item.id}`" in CADASTROS
print("OK: contratos de API, Repository, Docker e relacionamento Lote/Movimentacao conferidos.")

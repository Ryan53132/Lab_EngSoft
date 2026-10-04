# Projeto de Laboratório de Engenharia de Software
# Mini-Mercado

<p align="center">
    <br>Sumário</br>
  | <a href ="#desafio"> Desafio</a>  |
  <a href ="#tecnologias">Tecnologias</a> |
  <a href ="#backlog"> Backlog do Produto</a>  |
  <a href ="#manual"> Manual de Instalação</a>  | 
</p>

## 🎓 Integrantes

| Nome | GitHub |
| :------ | :-------- |
| Léo Naito | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/LNaito) |
| Ryan Araújo | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ryan53132) |
| Tiago Maneca | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/HelionLight) |

## 🏅 Desafio <a id="desafio"></a>
Desenvolver uma aplicação web de gerenciamento de mercadorias de um supermercado, permitindo o cadastro de produtos, categorias, fornecedores e lotes, além de possuir alertas automáticos para produtos em baixa disponibilidade, assim facilitando o gerenciamento de estoque.

O professor também estabeleceu dois Design Patterns obrigatórios: Observer e Facade.

---

## 💻 Tecnologias <a id="tecnologias"></a>
<h4 align="center">
      <img title="PostgreSQL" alt="PostgreSQL" src="https://skillicons.dev/icons?i=postgresql" />
      <img title="React" alt="React" src="https://skillicons.dev/icons?i=react" />
      <img title="TypeScript" alt="TypeScript" src="https://skillicons.dev/icons?i=typescript" />
      <img title="Docker" alt="Docker" src="https://skillicons.dev/icons?i=docker" />
      <img title="Git" alt="Git" src="https://skillicons.dev/icons?i=git" />
      <img title="GitHub" alt="GitHub" src="https://skillicons.dev/icons?i=github" />
      <img title="PostgreSQL" alt="PostgreSQL" src="https://skillicons.dev/icons?i=fastapi" />
      <img title="PostgreSQL" alt="PostgreSQL" src="https://skillicons.dev/icons?i=vite" />
      <img title="VS Code" alt="VS Code" src="https://skillicons.dev/icons?i=vscode" />
</h4>

---

## 📋 Backlog do Produto <a id="backlog"></a>

| # | US | Prioridade | User Story | Sprint | Status |
| :--: | :--------- | :--------: | :----: | :----: | :----: |
| 1 | US-01 | 🔴 ALTA | Como Funcionário, quero gerenciar os produtos em estoque do supermercado, podendo realizar a reposição ou diminuição do estoque de cada um. | 1 | ✔️ |
| 2 | US-02 | 🔴 ALTA | Como Funcionário, quero acessar uma área de alertas que me avisam sobre estados específicos de certos produtos, como produto próximo da validade ou em baixo estoque. | 1 | ✔️ |
| 3 | US-03 | 🟡 BAIXA | Como Funcionário, quero que o sistema calcule automaticamente promoções de produtos perto do vencimento. | 1 | ✔️ |
| 4 | US-04 | 🟠 MÉDIA | Como Funcionário, quero possuir um histórico completo de auditagem de movimentações de produtos no estoque. | 2 | Não concluída |
| 5 | US-05 | 🟠 MÉDIA | Como Funcionário, quero cadastrar informações secundárias sobre os produtos, como fornecedores, lotes e novas categorias. | 2 | Não concluída |

---

## 🏆 DoD - Definition of Done <a id="dod"></a>

| Critério | Descrição |
| :--------------------------------------: | :------------------------------------------------------------------------------------- |
| **Critérios de Aceitação atendidos** | Todos os critérios e regras de negócio da User Story foram atendidos. |
| **Testes manuais realizados** | Onde aplicável, os dados são corretamente armazenados e recuperáveis. |
| **Código revisado** | O código foi revisado por pelo menos um colega de equipe. |
| **Integração com outras partes testadas** | As interfaces entre Frontend e Backend foram validadas. |

---

## 📖 Manual de Instalação <a id="manual"></a>

### 🛠 Pré-requisitos para rodar o projeto

- **Git** — clonagem do repositório
- **Docker** e **Docker Compose** — sobe o frontend e a infraestrutura.

### 1. Clonar o projeto

```bash
git clone https://github.com/Equipe-SUL/Stentio.git
cd Stentio
```

### 2. Rodando o Docker

```bash
docker compose up -d --build
```

Acompanhe a subida com `docker compose ps`.

Você poderá acessar a aplicação através de: `http://localhost:5173/produtos`

### 3. Parar os serviços

```bash
# Parar os containers
docker compose down

# Parar os containers e apagar os volumes (reset completo dos bancos)
docker compose down -v
```

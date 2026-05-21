# Loom - Armário Virtual

Sistema colaborativo e pessoal para organizar e montar combinações de roupas.

## Funcionalidades
* **O Closet:** Visualize todas as suas roupas categorizadas.
* **Combinações:** Crie looks definindo o clima e ocasião.
* **Admin Integrado:** Gerencie usuários, roupas e acompanhe logs de atividade.

## Como Executar Localmente

O projeto já está 100% conteinerizado usando Docker. O banco de dados PostgreSQL interno não vai conflitar com o seu (que roda na porta 5432), pois o container usa uma rede interna e se expõe na porta `5433` (apenas para debug, se necessário).

1. Abra o terminal na raiz do projeto.
2. Execute o comando:
   ```bash
   docker compose up --build
   ```
3. Aguarde o build (isso pode levar alguns minutos na primeira vez).
4. O Backend (API) estará disponível em `http://localhost:8000`
5. O Frontend estará disponível em `http://localhost:3000`

### Como Criar o Usuário Administrador (Pela primeira vez)
Como não há tela pública de cadastro e o banco de dados acabou de ser criado, você precisa criar o seu usuário Administrador. Com o docker compose rodando, em um novo terminal, execute:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```
Siga os prompts para criar seu usuário e senha.

### Acessando o Painel de Administração
Acesse `http://localhost:8000/admin` e faça login com o superusuário criado. 
Por lá você pode:
- Fazer upload de **ClothingItems** (Fotos de roupas com categorias).
- Cadastrar novos **Usuários** (Sua namorada, familiares).
- Ver os **ActivityLogs** (Histórico de quem criou looks ou roupas).

Depois disso, basta acessar o frontend em `http://localhost:3000` e fazer login com qualquer conta cadastrada!

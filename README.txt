SEMEC DEMANDAS PRO

O QUE TEM:
- Login por e-mail e senha
- Dashboard
- Painel Hoje, Urgentes, Atrasadas, Aguardando e Concluídas
- Busca
- Filtros por status, prioridade e responsável
- Prioridade: urgente, importante e depois
- Responsável
- Setor/escola
- Prazo
- Observações
- Upload de anexo
- Tarefas atrasadas automáticas
- Layout responsivo para celular

COMO INSTALAR:

1. Crie ou use um projeto no Supabase.

2. No Supabase, vá em:
SQL Editor > New Query

3. Abra o arquivo:
supabase-tabela.sql

4. Cole tudo e clique em RUN.

5. No Supabase, vá em:
Authentication > Sign In / Providers

6. Ative Email.

7. Vá em:
Authentication > Users

8. Crie os usuários:
- seu e-mail
- e-mail da Andressa

9. Vá em:
Project Settings > API

10. Copie:
Project URL
anon public key

11. Abra script.js e troque:

const SUPABASE_URL = "COLE_AQUI";
const SUPABASE_KEY = "COLE_AQUI";

pela sua URL e chave.

A URL deve ficar só assim:
https://xxxxx.supabase.co

Não coloque /rest/v1.

12. Suba os arquivos no GitHub:
index.html
style.css
script.js
supabase-tabela.sql
README.txt

13. Ative GitHub Pages:
Settings > Pages > Branch main > Save

PRONTO.

OBSERVAÇÃO:
O bucket de anexos se chama "anexos". O SQL já tenta criar automaticamente.
Se o Supabase bloquear por alguma configuração, crie manualmente:
Storage > New Bucket > anexos > Public bucket

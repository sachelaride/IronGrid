# Publicacao e contribuicao

As contribuicoes aceitas serao distribuidas sob a GPLv3-or-later junto com o
projeto. Ao abrir um Pull Request, confirme que voce tem os direitos
necessarios para contribuir com o codigo e que ele nao inclui material de
terceiros incompatível com essa licenca.

## O que entra no repositorio

Este repositorio deve conter apenas codigo-fonte, configuracoes sem credenciais,
migracoes, documentacao e scripts necessarios para reproduzir a instalacao.

Nao publique arquivos `.env`, bancos, backups, logs, `node_modules`, `dist`,
pacotes `.tar.gz`, instaladores gerados ou chaves privadas. O `.gitignore` da
raiz ja cobre esses casos, mas revise `git status` antes de cada envio.

## Preparar uma copia publica

1. Copie `.env.docker.example` para `.env.docker`.
2. Gere senhas e tokens novos, longos e aleatorios para PostgreSQL, InfluxDB,
   `JWT_SECRET` e `AGENT_INGEST_TOKEN`.
3. Ajuste `ALLOWED_ORIGIN` para os enderecos reais usados pelos usuarios.
4. Confirme que `git status --short` nao lista ambientes, dados ou artefatos.
5. Procure valores acidentais com `rg -n -i 'password|secret|token|private key'`
   e revise cada resultado antes do primeiro `git push`.

Se qualquer segredo que aparece neste computador ja foi usado em um ambiente
real, considere-o comprometido e faca a rotacao antes de publicar o codigo.

## Comentarios no codigo

Os fontes devem explicar responsabilidades de modulos, configuracoes e fluxos
complexos. Comentarios mecanicos em todas as linhas nao sao usados: eles tornam
alteracoes mais dificeis de revisar e rapidamente ficam desatualizados. Prefira
nomes claros, funcoes pequenas e comentarios que expliquem uma decisao ou
restricao que nao seja obvia pelo codigo.

## Fluxo de mudancas

1. Abra uma issue para discutir uma mudanca maior ou use o template apropriado.
2. Crie uma branch a partir de `main` e faca commits pequenos e descritivos.
3. Abra um Pull Request preenchendo o checklist; nao envie segredos ou dados
   de clientes.
4. Aguarde os checks automaticos e a revisao de um mantenedor.
5. O merge deve ser feito pelo mantenedor depois de todas as conversas serem
   resolvidas e das aprovacoes exigidas pela protecao da branch.

No GitHub, ative em `Settings > Branches` uma regra para `main` com Pull
Request obrigatorio, pelo menos uma aprovacao, aprovacao de code owner quando
aplicavel, checks obrigatorios da workflow `Validar projeto`, conversas
resolvidas e bloqueio de push direto. Substitua o placeholder em
`.github/CODEOWNERS` pelo usuario ou equipe real antes de publicar.
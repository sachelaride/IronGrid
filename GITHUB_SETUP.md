# Configuracao recomendada do GitHub

Use estas informacoes em `Settings > General` do repositorio.

## Description

`Open source network monitoring, network inventory and IT infrastructure management for Linux and Docker.`

## Topics

```text
network-monitoring
network-management
infrastructure-monitoring
snmp
network-inventory
linux
docker
open-source
it-infrastructure
```

## Recursos da comunidade

- Ative **Issues** para bugs e sugestoes.
- Ative **Discussions** para perguntas, ideias e troca entre usuarios.
- Mantenha o [Pull Request template](.github/pull_request_template.md).
- Mantenha os templates de [Issues](.github/ISSUE_TEMPLATE/).
- Substitua o placeholder de [CODEOWNERS](.github/CODEOWNERS) pelo usuario ou
  equipe que deve revisar alteracoes.

## Branch main

Em `Settings > Branches`, crie uma regra para `main` com:

- Pull Request obrigatorio;
- pelo menos uma aprovacao de mantenedor;
- checks obrigatorios da workflow `Validar projeto`;
- conversas resolvidas antes do merge;
- bloqueio de push direto;
- aprovacao de Code Owner quando aplicavel.

## GitHub Pages

Em `Settings > Pages`, selecione `GitHub Actions` como origem. O workflow
`.github/workflows/pages.yml` publica os manuais em:

`https://sachelaride.github.io/IronGrid/index.html`

## Releases

Publique cada versao com uma tag semantica, por exemplo `v12.0.0`, e anexe
somente pacotes de distribuicao, checksums e documentacao. Nunca anexe `.env`,
bancos, backups, chaves privadas ou a pasta `desnecessarios/`.

---
id: browserstack
title: Teste de acessibilidade do BrowserStack
---

# Teste de acessibilidade do BrowserStack

Você pode integrar facilmente testes de acessibilidade em seus conjuntos de testes do WebdriverIO usando o recurso de testes automatizados do BrowserStack Accessibility Testing.

## Vantagens dos testes automatizados no teste de acessibilidade do BrowserStack.

Para usar testes automatizados no BrowserStack Accessibility Testing, seus testes devem estar em execução no BrowserStack Automate.

As seguintes são as vantagens dos testes automatizados:

- Integra-se perfeitamente ao seu conjunto de testes de automação pré-existente.
- Nenhuma alteração de código é necessária em casos de teste.
- Não requer manutenção adicional para testes de acessibilidade.
- Entenda tendências históricas e obtenha insights de casos de teste.

## Comece com o teste de acessibilidade do BrowserStack

Siga estas etapas para integrar seus conjuntos de testes do WebdriverIO com o teste de acessibilidade do BrowserStack:

1. Instale o pacote npm `@wdio/browserstack-service`.

```bash npm2yarn
npm install --save-dev @wdio/browserstack-service
```

2. Atualize o arquivo de configuração `wdio.conf.js`.

```javascript
exports.config = {
  //...
  user: '<browserstack_username>' || process.env.BROWSERSTACK_USERNAME,
  key: '<browserstack_access_key>' || process.env.BROWSERSTACK_ACCESS_KEY,
  commonCapabilities: {
    'bstack:options': {
      projectName: "Insira aqui o nome fixo do seu projeto",
      buildName: "Insira aqui o nome fixo da sua build/job"
    }
  },
  services: [
    ['browserstack', {
      accessibility: true,
      // Opções de configuração opcionais
      accessibilityOptions: {
        'wcagVersion': 'wcag21a',
        'includeIssueType': {
          'bestPractice': false,
          'needsReview': true
        },
        'includeTagsInTestingScope': ['Especifique as tags dos casos de teste a serem incluídas'],
        'excludeTagsInTestingScope': ['Especifique as tags dos casos de teste a serem excluídas']
      },
    }]
  ],
  //...
};
```

Você pode ver instruções detalhadas aqui.


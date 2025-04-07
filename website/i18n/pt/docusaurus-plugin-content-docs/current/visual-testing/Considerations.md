---
index: 1
id: considerações
title: Considerações
---

# Principais considerações para uso ideal

Antes de mergulhar nos poderosos recursos do `@wdio/visual-service`, é crucial entender algumas considerações importantes que garantem que você aproveite ao máximo esta ferramenta. Os pontos a seguir foram elaborados para orientar você sobre as melhores práticas e armadilhas comuns, ajudando você a obter resultados de testes visuais precisos e eficientes. Essas considerações não são apenas recomendações, mas aspectos essenciais a serem lembrados para utilizar o serviço de forma eficaz em cenários do mundo real.

## Natureza da Comparação

- **Base pixel por pixel:** O módulo realiza uma comparação pixel por pixel das imagens. Embora certos aspectos possam ser ajustados (veja Opções de comparação), a abordagem principal continua sendo uma comparação básica de pixels.
- **Impacto das atualizações do navegador:** Esteja ciente de que atualizações de navegadores, como o Chrome, podem afetar a renderização de fontes, possivelmente exigindo uma atualização de suas imagens de base.

## Consistência em Plataformas

- **Comparando plataformas idênticas:** certifique-se de que as capturas de tela sejam comparadas na mesma plataforma. Por exemplo, uma captura de tela do Chrome em um Mac não deve ser usada para comparar com uma do Chrome no Ubuntu ou Windows.
- **Analogia:** Para simplificar, compare _'Apples com Apples , não Apples com Androids'_.

## Cuidado com a porcentagem de incompatibilidade

- **Risco de aceitar incompatibilidades:** tenha cuidado ao aceitar uma porcentagem de incompatibilidade. Isso é especialmente verdadeiro para capturas de tela grandes, onde aceitar uma incompatibilidade pode inadvertidamente ignorar discrepâncias significativas, como botões ou elementos ausentes.

## Simulação de tela móvel

- **Evite redimensionar o navegador para simulação em dispositivos móveis:** não tente simular o tamanho da tela de dispositivos móveis redimensionando navegadores de desktop e tratando-os como navegadores de dispositivos móveis. Os navegadores de desktop, mesmo quando redimensionados, não replicam com precisão a renderização dos navegadores móveis reais.
- **Autenticidade na comparação:** esta ferramenta tem como objetivo comparar elementos visuais como eles apareceriam para um usuário final. Um navegador de desktop redimensionado não reflete a verdadeira experiência em um dispositivo móvel.

## Posição sobre navegadores sem cabeça

- **Não recomendado para navegadores sem interface:** O uso deste módulo com navegadores sem interface não é recomendado. A justificativa é que os usuários finais não interagem com navegadores headless e, portanto, problemas decorrentes desse uso não serão suportados.

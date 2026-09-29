# Rule34 Filter

Extensão com popup em português para ativar/desativar a filtragem, pesquisar as opções e selecionar tags por checkbox. Marcar uma opção oculta os posts correspondentes. As alterações se aplicam às páginas já abertas e aos posts carregados dinamicamente.

Os 21 filtros anteriores continuam selecionados por padrão. Futa (tags `futa` e `futanari`) e Blacked (tag `blacked`) estão disponíveis para seleção. A busca procura opções na lista, sem alterar as seleções. Desativar a filtragem preserva as escolhas e restaura os posts ocultados pela extensão.

As tags são comparadas por inteiro, sem diferenciar maiúsculas de minúsculas, nos atributos `title` e `alt` das miniaturas `span.thumb`. Por exemplo, `pee` não bloqueia `speed`. Posts sem essas tags não são classificados por imagem. As preferências ficam no armazenamento local do navegador; não há envio de dados nem sincronização entre navegadores.

## Chrome, Edge, Brave, Opera e Vivaldi (desktop)

1. Extraia `rule34-filter-v3.zip` para uma pasta permanente, ou use a pasta `rule34-filter` deste projeto.
2. Abra a página de extensões do navegador e ative o **Modo do desenvolvedor**.
3. Escolha **Carregar sem compactação** e selecione a pasta que contém `manifest.json`.
4. Fixe a extensão na barra e clique no ícone para abrir os controles.

Ao atualizar uma instalação existente, recarregue a extensão e as abas do site uma vez para substituir o script antigo. Se necessário, permita o acesso da extensão a `rule34.xxx` nas configurações do navegador.

## Firefox (desktop)

1. Abra `about:debugging#/runtime/this-firefox`.
2. Clique em **Carregar extensão temporária** e selecione `rule34-filter/manifest.json`.
3. Abra o popup pelo menu de extensões e conceda acesso ao site se solicitado.

O carregamento temporário termina quando o Firefox fecha. Uma instalação permanente na versão comum do Firefox exige um pacote assinado pela Mozilla. O manifesto inclui identificador e declaração de ausência de coleta de dados para esse processo; o pacote deste projeto não está assinado.

## Safari

O código usa APIs WebExtensions compartilhadas, mas o Safari exige um aplicativo empacotado com as ferramentas da Apple em um Mac. No Mac com Xcode, execute:

```sh
xcrun safari-web-extension-converter /caminho/para/rule34-filter
```

Abra o projeto gerado no Xcode, configure a assinatura, compile e habilite a extensão no Safari. Esse pacote nativo não foi gerado nem validado neste ambiente Windows.

Referências: [APIs entre navegadores](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API), [extensões do Safari](https://developer.apple.com/safari/extensions/).

Navegadores que não aceitam WebExtensions, versões antigas e navegadores móveis sem suporte a extensões não podem instalar este ZIP. A compatibilidade real depende do suporte do navegador; não há um pacote instalável universal.

## Verificação

Execute `node --test tests/extension.test.cjs`. Os testes verificam armazenamento nos dois modelos de API (`chrome` e `browser`), correspondência das tags, restauração dos posts, alterações dinâmicas, pesquisa do popup e erros ao salvar usando simulações das APIs e do DOM. Não substituem testes em navegadores reais.

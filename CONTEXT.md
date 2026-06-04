# InspirAI

Calendário de conteúdo para Instagram: uma postagem planejada por dia do calendário, com frase na arte, legenda e imagem composta para exportação.

## Language

**Postagem**:
O conteúdo associado a um único dia do calendário (frase, legenda, status, fundo e arte final).
_Avoid_: Post, card, slot

**Formato de entrega**:
A proporção da arte exportada para o Instagram: feed (1:1) ou story (9:16). Cada postagem tem exatamente um formato de entrega por vez. Trocar o formato recompõe a arte com o mesmo fundo (origem ativa), aplicando novo recorte proporcional. O padrão para postagens novas ou sem formato definido é feed.
_Avoid_: Tipo de post, aspect ratio, layout mode

**Arte**:
A imagem final composta (fundo + overlay + frase) pronta para download, nas dimensões do formato de entrega escolhido.
_Avoid_: Imagem, PNG, canvas output

**Exportação da arte**:
Download da arte em PNG; o nome do arquivo inclui a data da postagem e o formato de entrega (feed ou story).
_Avoid_: Download, baixar imagem, save

**Frase na arte**:
O texto curto renderizado sobre o fundo na arte (distinto da legenda do Instagram). Um único texto por postagem; o tamanho é controlado por um slider; ao usar story, o layout aplica ajuste automático de posição e quebra de linha respeitando área segura.
_Avoid_: Quote, texto do post, headline

**Legenda**:
O texto publicado junto à arte no Instagram (hashtags, CTA, contexto). Uma única legenda por postagem, compartilhada entre feed e story.
_Avoid_: Caption, descrição, texto do Instagram

**Área segura do story**:
Região da arte em formato story onde a frase não deve invadir, principalmente a faixa inferior reservada a controles do Instagram (resposta, stickers, etc.).
_Avoid_: Safe zone, margem, padding

**Pré-visualização**:
Representação da arte no editor antes do download. No modal do dia, segue a proporção do formato de entrega ativo (feed ou story).
_Avoid_: Preview, mockup, thumbnail do editor

**Miniatura do calendário**:
Representação compacta da postagem na grade mensal. Sempre em recorte quadrado; o formato de entrega ativo é indicado por um badge (feed ou story), não pela proporção da célula.
_Avoid_: Thumbnail, preview do calendário, capa do dia

**Fundo**:
A camada fotográfica ou gerada que fica atrás da frase na arte, antes do overlay e do texto.
_Avoid_: Background, imagem de fundo, wallpaper

**Origem do fundo**:
De onde vem o fundo de uma postagem: gerada por IA ou enviada pelo usuário (foto personalizada). Uma postagem pode ter as duas origens guardadas, mas só uma origem ativa compõe a arte por vez.
_Avoid_: Modo de imagem, source type, tipo de fundo

**Foto personalizada**:
Arquivo enviado pelo usuário que serve como fundo quando a origem do fundo ativa é a foto personalizada. Formatos aceitos no MVP: JPEG, PNG e WebP. Ao concluir o envio, torna-se a origem ativa automaticamente. Há no máximo uma por postagem; um novo envio substitui a anterior; o usuário pode remover explicitamente, o que apaga o arquivo e, se era a origem ativa, restaura o fundo IA como origem ativa.
_Avoid_: Upload, imagem customizada, minha foto

**Origem ativa**:
A origem do fundo usada na composição da arte no momento (IA ou foto personalizada). A origem inativa permanece armazenada e pode ser reativada sem novo envio nem nova geração.
_Avoid_: Modo selecionado, fundo atual, source ativo

**Regeneração de fundo IA**:
Produzir uma nova versão do fundo IA da postagem, substituindo apenas esse fundo. Não remove a foto personalizada nem altera a origem ativa.
_Avoid_: Regenerar post, gerar de novo, refazer imagem

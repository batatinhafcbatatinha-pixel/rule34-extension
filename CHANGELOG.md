# Changelog

Na versão 3.1.2, a regra de ocultação também se aplica diretamente às imagens dentro do elemento bloqueado. Isso evita miniaturas visíveis quando os estilos da página mantêm o contêiner exibido. Verificado manualmente no Chrome na listagem `shrek_(series)`: as miniaturas dos posts `13216944` e `13213200` desaparecem ao ativar a filtragem e reaparecem ao desativá-la, sem recarregar a página.

Na versão 3.1.3, o contêiner bloqueado recebe display: none com prioridade inline, preservando seu estilo anterior para restauração. Isso também oculta botões de download e elimina os espaços dos posts bloqueados, inclusive quando outro script altera o layout. Verificado no Chrome: 19 posts visíveis e 19 botões associados, sem os cartões dos posts 13216944 e 13213200.

# Cantiere Vivo

Gioco formativo in italiano sull’azione di un sindacalista FILCA in un cantiere immaginario. Scenario 2.5D esplorabile con percorsi guidati, sprite direzionali, colloqui, raccolta di informazioni, scelte, verifiche e diario scaricabile.

## Giocare

Aprire il sito, toccare un personaggio per raggiungerlo e parlare. Trascinare per spostare la visuale, usare i controlli di zoom o la minimappa. Da tastiera: frecce/WASD per camminare lungo i percorsi, Invio per parlare.

Ogni partita dura dieci giornate (08:00–17:00). Gli spostamenti e gli incontri consumano tempo; la lettura dei dialoghi non fa avanzare l’orologio. La partita viene salvata nel localStorage di questo browser. Una nuova partita sostituisce il salvataggio, previa conferma nell’interfaccia.

Il motore usa un seed casuale per combinare 24 casi, nove eventi, interlocutori, imprese, atteggiamenti aziendali, posizioni dei personaggi, condizioni meteorologiche, durata degli incontri e verifiche successive. I temi possono ritornare dopo l’esaurimento del mazzo; non si tratta di generazione infinita di contenuti. Le scelte e gli impegni aperti incidono sugli sviluppi.

## Struttura

- `index.html`, `style.css`: interfaccia responsive.
- `app.js`: scena canvas, sprite, navigazione e dialoghi.
- `navigation.js`: grafo dei percorsi percorribili.
- `engine.js`: stato, estrazione dei casi e conseguenze.
- `cases.js`: casi e restituzioni formative.
- `assets/`: ambiente e personaggi generati per il progetto.

Nessuna dipendenza di runtime o servizio remoto è necessario per giocare. Servire `` tramite un server statico; aprire i file direttamente può limitare il caricamento delle immagini in alcuni browser.

## Verifiche

```sh
node tests/game.test.cjs
node tests/interface.test.cjs
```

Le verifiche coprono 160 campagne complete, variabilità e riproducibilità, raggiungibilità dei casi, limiti degli indici, verifica degli impegni, navigazione e flussi dell’interfaccia con un contesto DOM/canvas simulato. Non sostituiscono il controllo visivo in un browser reale.

## Contenuti formativi

Persone, imprese e punteggi sono immaginari. Gli indici non attestano conformità e non rappresentano diritti reali. Per casi concreti vanno verificati contratto, fonti competenti e regole territoriali. Riferimenti a CNCE e FILCA sono disponibili nel gioco.

## GitHub Pages

In Settings → Pages scegliere Deploy from a branch, ramo main, directory / (root). Il gioco usa percorsi relativi ed è compatibile con una pagina di progetto GitHub Pages. Nessun accesso ChatGPT è necessario per eseguirlo.

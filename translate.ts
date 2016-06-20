// NOTE: The text is just text. It can be used as html or as plain text in the code.
// There is no general rule if it is html or plain text, but in many cases 
// it is passed to shims.setTextContent(), in which case it is used as plain text.
// Hints are always plain text, with special placeholders (e.g. [grab]).
module translate {
    /**
     Sets the language to 'en' for English or 'de' for German.
     this unit needs to know the language to be used. 
     if the user changes the language then a reload is needed. 
     However, at the start up the user language may be unknown until the model is loaded.
     So 'en' is used until then. 
    */
    export function setLanguage(l: string) {
        if (l) language = l
    }
    var language: string = 'en'

    function getLanguage() {
        if (!language) return 'en'
        return language
    }
    /** An object that contains text in different languages. */
    export interface IMultiLangText {
        de: string;
        en: string;
    }
    /** A bundle contains other bundles and a set of texts. */
    export interface IBundle {
        getBundle(id: string): IBundle;
        getText(id: string): string;
        getMultiLangText(id: string): IMultiLangText;
        setText(id: string, text: IMultiLangText);
        setBundle(id: string, bundle: IBundle): IBundle;
    }
    class Bundle {
        private _bundles: {
            [id: string]: IBundle;
        } = {}
        private _texts: {
            [id: string]: IMultiLangText;
        } = {}
        getBundle(id: string): IBundle {
            return this._bundles[id]
        }
        getText(id: string, lang: string = getLanguage()): string {
            return this._texts[id][lang]
        }
        getMultiLangText(id: string): IMultiLangText {
            return this._texts[id]
        }
        setBundle(id: string, bundle: IBundle): IBundle {
            return this._bundles[id] = bundle
        }
        setText(id: string, text: IMultiLangText) {
            this._texts[id] = text
        }
    }
    export function getBundle(id: string): IBundle {
        return <IBundle>this[id]
    }
    export var loading: IBundle = new Bundle()
    export var credits: IBundle = new Bundle()
    export var main_menu: IBundle = new Bundle()
    export var level_pack: IBundle = new Bundle()
    export var gameplay: IBundle = new Bundle()
    export var you_got_it: IBundle = new Bundle()
    export var levels: IBundle = new Bundle()
    loading.setText('loading', {
        en: 'Loading',
        de: 'Lädt'
    })
    loading.setText('ready', {
        en: 'Ready',
        de: 'Bereit'
    })
    loading.setText('click2start', {
        en: 'Click to start the game.',
        de: 'Klick, um das Spiel zu starten.'
    })
    //credits.setText('',{en:'',de:''})
    credits.setText('close', {
        en: 'Back to the game',
        de: 'Zurück zum Spiel'
    })
    // used on the button to show the credits:
    credits.setText('show', {
        en: 'About this game',
        de: 'Über dieses Spiel'
    })
    // The longer text of the credits is in default.html and only one language is displayed.
    main_menu.setText('level packs', {
        en: 'Level Packs',
        de: 'Level Packs'
    }) // header
    main_menu.setText('click2play', {
        en: 'Click to Play',
        de: 'Klick zum Spielen'
    })
    level_pack.setText('back', {
        en: 'BACK',
        de: 'ZURÜCK'
    })
    gameplay.setText('goal', {
        en: 'GOAL',
        de: 'ZIEL'
    })
    gameplay.setText('clearmessage', {
        en: 'Are you sure you want to clear your progress?',
        de: 'Bist du sicher, dass du deinen Fortschritt löschen möchtest?'
    })
    gameplay.setText('stop2change', {
        en: 'Stop the animation to change the code.',
        de: 'Stoppe die Animation, um den Code zu ändern.'
    })
    gameplay.setText('cancel', {
        en: 'CANCEL',
        de: 'ABBRUCH'
    })
    gameplay.setText('clear', {
        en: 'CLEAR',
        de: 'CLEAR'
    })
    you_got_it.setText('you got it', {
        en: 'YOU GOT IT',
        de: 'GESCHAFFT!'
    })
    you_got_it.setText('shortest solution', {
        en: 'You found the shortest solution!',
        de: 'Du hast die kürzeste Lösung gefunden.'
    })
    // Note: this is html:
    you_got_it.setText('unknown solution', {
        en: 'Congratulations, you found<br />an unknown solution.',
        de: 'Gratulation, du hast eine<br />unbekannte Lösung gefunden.'
    })
    // Here come the levels. We just need to make sure there is no circular dependancy!
    // That's why translate.ts knows nothing of level.ts.
    // Each level has an entry mapped to "hints", that can be displayed by clicking the "hints"-button.
    levels.setText('dragOther', {
        en: 'Drag another element!',
        de: 'Nimm ein anderes Element!'
    });
    levels.setText('drop', {
        en: 'Drop it here.',
        de: 'Lege es hier ab.'
    })
    levels.setText('play', {
        en: 'Press play.',
        de: 'Drücke "Play".'
    })
    levels.setText('stop', {
        en: 'Your program finished\nexecuting. Press stop',
        de: 'Dein Programm ist beendet.\nDrücke "Stopp"'
    })
    levels.setText('short', {
        en: 'The shortest solution uses $1 registers.',
        de: 'Die kürzeste Lösung benötigt $1 Register.'
    })
    var cargo101 = new Bundle()
    levels.setBundle('Cargo 101', cargo101)
    cargo101.setText('hints', {
        en: 'down, right, down',
        de: 'runter, rechts, runter'
    })
    cargo101.setText('A', {
        en: 'Program your claw,\ndrag [grab] to Prog 1.',
        de: 'Programmiere deinen Greifarm,\nziehe [grab] zu Prog 1.'
    })
    cargo101.setText('B', {
        en: 'Drag [right] to Prog 1.',
        de: 'Ziehe [right] zu Prog 1.'
    })
    cargo101.setText('C', {
        en: 'Drag [grab] to Prog 1.',
        de: 'Ziehe [grab] zu Prog 1.'
    })
    var transporter = new Bundle()
    levels.setBundle('Transporter', transporter)
    transporter.setText('hints', {
        en: 'Reuse the solution from level 1 and loop through it.\n\n[short 4]',
        de: 'Verwende die Lösung aus dem Level 1 und bilde eine Schlaufe.\n\n[short 4]'
    })
    transporter.setText('yourself', {
        en: 'Now try it yourself. Move the\ncrate further as shown above',
        de: 'Jetzt versuche es selbst.\nVerschiebe die Kiste weiter,\nwie oben gezeigt'
    })
    var recurses = new Bundle()
    levels.setBundle('Re-Curses', recurses)
    recurses.setText('hints', {
        en: 'Move one crate to the right, go back to the original position, and then loop.\n\n[short 5]',
        de: 'Bewege eine Kiste nach rechts, gehe zurück zur ersten Position und bilde eine Schlaufe.\n\n[short 5]',
    })
    recurses.setText('loop', {
        en: 'Create a loop\nDrag [prog1] to Prog1',
        de: 'Mach eine Schlaufe\nZiehe [prog1] zu Prog1'
    })
    recurses.setText('move', {
        en: 'You can also move\ncommands around. Pick it\nup from here to move it',
        de: 'Du kannst auch Befehle\nverschieben. Greife es hier,\num es zu bewegen'
    })
    recurses.setText('grab', {
        en: 'Drag [grab] to Prog1',
        de: 'Ziehe [grab] zu Prog1'
    })
    recurses.setText('well done', {
        en: 'Well done, the program is now looping\nTry to solve this level now using a loop',
        de: 'Gut gemacht! Die Schlaufe funktioniert.\nVersuche nun den Level mit einer Schlaufe zu lösen'
    })
    var inverter = new Bundle()
    levels.setBundle('Inverter', inverter)
    inverter.setText('hints', {
        en: 'Move all four blocks one spot to the right, and repeat.\n\n[short 10]',
        de: 'Bewege alle vier Kisten um einen Platz nach rechts, wiederhole.\n\n[short 10]'
    })
    inverter.setText('use progs', {
        en: 'Use Progs to make your solutions shorter.\nShorter programs are awarded more stars',
        de: 'Verwende "Progs", um deine Lösungen\nzu verkürzen. Kürzere Programme erhalten\nmehr Sterne'
    })
    inverter.setText('move', {
        en: 'Move to Prog2',
        de: 'Verschiebe zu Prog2'
    })
    inverter.setText('drag', {
        en: 'Drag [prog2] to Prog1',
        de: 'Ziehe [prog2] zu Prog1'
    })
    inverter.setText('another', {
        en: 'Drag another one',
        de: 'Ziehe noch eines'
    })
    inverter.setText('each time', {
        en: 'Each time Prog2 is executed, its entire sequence is executed\n\n' + 'Press play to see how it works,\nand try to solve this level using Prog2',
        de: 'Jedes mal wenn Prog2 ausgeführt wird,\nwird die komplette Sequenz ausgeführt\n\n' + 'Drücke "Play" um zu sehen wie es funktioniert\nund versuche den Level mit Prog2 zu lösen.'
    })
    var fb2 = new Bundle()
    levels.setBundle('From Beneath2', fb2)
    fb2.setText('A', {
        en: 'Conditional modifiers\nDrag [yellow] onto [right] in Prog1.\nIt will only execute if the claw\nis holding a yellow <img src="gfx/Crate_Yellow_2.png" width="20" height="20" alt="yellow" /> crate',
        de: 'Bedingungsüberprüfung\nZieh [yellow] auf [right] in Prog1.\nEs wird nur ausgefürht, \nwenn der Kran eine gelbe \n<img src="gfx/Crate_Yellow_2.png" width="20" height="20" alt="yellow" /> Kiste hält'
    })
    fb2.setText('B', {
        en: 'Drag [empty] onto [left] in Prog1.\nIt will only execute if the claw\nis not holding any crates',
        de: 'Zieh [empty] auf [left] in Prog1.\nEs wird nur ausgefürht wenn\nder Kran keine Kiste hält'
    })
    fb2.setText('C', {
        en: 'This is the step button. Press it to\nexecute a single instruction.',
        de: 'Das is der Schrittknopf. Drücke ihn\nund es wird ein Befehl ausgefürht.'
    })
    fb2.setText('D', {
        en: 'Press it at your own pace\nuntil the program is done',
        de: 'Drück ihn in deinem eigenen\nTempo bis das Programm beendet ist '
    })
    fb2.setText('E', {
        en: 'That\'s it!\n\nOne last thing: use this button\nto clear your work. Try it now.',
        de: 'Das ist es! \n\nEine letzte Sache: verwende diesen\nKnopf um deine Arbeit zu löschen.\nVersuche es jetzt.'
    })
    fb2.setText('F', {
        en: 'Good job, you\'ve completed the\ntutorial. Now go and have fun!\n(click/touch to continue)',
        de: 'Gut gemacht, du hast das Tutorial beendet.\nGeh und hab Spass.\n(Click/Touch um fortzufahren)'
    })
    levels.setBundle('From Beneath', new Bundle()).setText('hints', {
        en: 'Go right once if holding blue, twice if holding yellow, and left if holding none.\nRepeat.\n\n[short 5]',
        de: 'Gehe um eins nach rechts bei blau, um zwei bei gelb und nach links, wenn leer.\nWiederhole.\n\n[short 5]'
    })
    levels.setBundle('Go Left', new Bundle()).setText('hints', {
        en: 'Move each pile to the left. Repeat.\n\n[short 9]',
        de: 'Bewege jeden Stapel nach links. Wiederhole.\n\n[short 9]'
    })
    levels.setBundle('Double Flip', new Bundle()).setText('hints', {
        en: 'Go right once if holding any, twice if holding blue, and left if holding none. Repeat.\n\n[short 5]',
        de: 'Gehe um eins nach rechts bei irgend einer Farbe, um zwei bei blau und nach links, wenn leer. Wiederhole.\n\n[short 5]'
    })
    levels.setBundle('Go Left 2', new Bundle()).setText('hints', {
        en: 'Go right if holding none, and left if holding any. Repeat.\n\n[short 4]',
        de: 'Gehe nach rechts, wenn leer, nach links bei irgendeiner Farbe. Wiederhole.\n\n[short 4]'
    })
    levels.setBundle('Shuffle Sort', new Bundle()).setText('hints', {
        // Original games uses "F2" instead of "Prog2"
        en: 'Alternate left and right, and make sure to use Prog2 to shorten your solution.\n\n[short 9]',
        de: 'Abwechselnd links und rechts, und verwende Prog2 um die Lösung kurz zu halten.\n\n[short 9]'
    })
    levels.setBundle('Go the Distance', new Bundle()).setText('hints', {
        en: 'Go right if holding none, and left if holding red. Repeat.\n\n[short 4]',
        de: 'Gehe nach rechts, wenn leer und nach links, wenn rot. Wiederhole.\n\n[short 4]'
    })
    levels.setBundle('Color Sort', new Bundle()).setText('hints', {
        // Original games uses "F1" instead of "Prog1"
        en: 'Go over each of the 3 piles and drop or pick up based on the color. When over the left pile drop if red, when over the right pile drop if green.\n\nThe shortest known solution uses 8 registers, all in Prog1.',
        de: 'Gehe über alle drei Stapel und greife aufgrund der Farbe. Wenn links, setze ab bei rot, wenn rechts, setze ab bei grün.\n\nDie kürzeste bekannte Lösung verwendet 8 Register, alle in Prog1.'
    })
    levels.setBundle('Walking Piles', new Bundle()).setText('hints', {
        en: 'For a 3 star solution, move each pile 3 slots to the right, and then repeat. This method can be implemented with 10 registers.\n\nThe shortest known solution uses 9 registers (with an approach that is very specific to this configuration)',
        de: 'Für drei Sterne bewegst du jeden Stapel um drei Stellen nach Rechts. Diese Methode kann mit 10 Registern implementiert werden.\n\nDie kürzeste bekannte Lösung verwendet 9 Register (ein sehr spezifischer Ansatz für diese Konfiguration)'
    })
    levels.setBundle('Repeat Inverter', new Bundle()).setText('hints', {
        en: 'It can be done with the usual 5 instructions and clever usage of conditional modifiers. Solutions with up to 7 instructions earn 3 stars.',
        de: 'Es kann mit den üblichen 5 Instruktionen und schlauer Verwendung von Bedingungen gelöst werden. Lösungen mit bis zu 7 Instruktionen erhalten 3 Sterne.'
    })
    levels.setBundle('Double Sort', new Bundle()).setText('hints', {
        en: 'Sort, go right, sort, go left. Repeat. Use at most 14 instructions for 3 stars.\n\n[short 11]',
        de: 'Sortiere, nach rechts, sortiere, nach links. Wiederhole. Verwende höchstens 14 Instruktionen für 3 Sterne.\n\n[short 11]'
    })
    levels.setBundle('Mirror', new Bundle()).setText('hints', {
        // Original games uses "F1" instead of "Prog1"
        en: 'Use at most 7 registers for 3 stars. There are various known solutions with 6 registers in Prog1, but no known solution with only 5.',
        de: 'Verwende höchstens 7 Instruktionen für 3 Sterne. Es sind mehrere Lösungen mit 6 Registern in Prog1 bekannt, aber keine mit nur 5.'
    })
    levels.setBundle('Lay it out', new Bundle()).setText('hints', {
        en: 'Move the pile one slot to the right and bring one crate back to the left.\n\n\n\n[short 7]',
        de: 'Bewege den Stapel um eins nach rechts und bringe eine Kiste zurück nach links.\n\n\n\n[short 7]'
    })
    levels.setBundle('The Stacker', new Bundle()).setText('hints', {
        en: 'Go left until you find an empty slot, and then move the last yellow crate one slot to the right. Repeat.\n\n[short 6]',
        de: 'Gehe nach links bis zum ersten leeren Platz, und bewege die letzte gelbe Kiste eins nach rechts. Wiederhole.\n\n[short 6]'
    })
    levels.setBundle('Clarity', new Bundle()).setText('hints', {
        en: 'A disguised version of Mirror.',
        de: 'Eine verschleierte Version von Mirror.'
    })
    levels.setBundle('Come Together', new Bundle()).setText('hints', {
        // Original games uses "F2" instead of "Prog2"
        en: 'You can go right and find a yellow crate, but when bringing it back how do you know when to stop so that you don\'t crash into the wall?\n\nIn Prog2 use the programming stack to count the number of times you have to go right until you find a yellow crate, then go back left that same number of times.\nAnother way to look at it: Prog2 is a recursive function that goes right until it finds a crate, and then it goes back to the original position.It can be implemented with 4 registers.\n\nThe shortest known solution uses a total of 7 registers',
        de: 'Du gehst nach rechts und findest eine gelbe Kiste. Aber wenn du zurück gehst — wie weisst du, wann du anhalten musst um nicht gegen die Wand zu fahren?\n\nIn Prog2, verwende den Aufruf-Stack, um die Anzahl Bewegungen nach rechts zu zählen bis eine Kiste gefunden ist, dann gehe geich oft nach links.\nEine andere Ansichtsweise: Prog2 ist eine rekursive Funktion die nach rechts geht bis eine gelbe Kiste gefunden wurde, und dann geht sie zurück zur Anfangsposition. Dies benötigt 4 Register.\n\Die kürzeste Lösung benötigt insgesamt 7 Register.'
    })
    levels.setBundle('Come Together 2', new Bundle()).setText('hints', {
        en: 'Another stack puzzle. Re-use the solution from the previous level with a small modification.\n\n[short 8]',
        de: 'Ein weiteres Aufruf-Stack-Puzzle. Verwende nochmals die Lösung vom letzten Level mit einer kleinen Anpassung.\n\n[short 8]'
    })
    levels.setBundle('Up The Greens', new Bundle()).setText('hints', {
        en: 'Very similar to the previous two levels but let the stack unwind and reset when you find a green. To do this only go left if holding a blue.\n\n[short 7]',
        de: 'Sehr ähnlich zu den vorherigen zwei Levels aber lasse den Aufruf-Stack bei einer grünen Kiste abbauen. Dazu gehst du nur nach links bei blau.\n\n[short 7]'
    })
    levels.setBundle('Fill The Blanks', new Bundle()).setText('hints', {
        en: 'As in the "Lay It Out" level, move the entire pile one slot to the right and bring one crate back to the left, except in the first iteration.n\n[short 11]',
        de: 'Wie im Level "Lay It Out". Bewege den ganzen Stabel um eins nach rechts und bringe eine Kiste zurück nach links, ausser beim ersten Durchgang.n\n[short 11]'
    })
    levels.setBundle('Count The Blues', new Bundle()).setText('hints', {
        en: 'Another stack puzzle. The number of blues indicates how many times to go right with the yellow.\n\n[short 9]',
        de: 'Ein weiteres Aufruf-Stack-Puzzle. Die Anzahl blauer Kisten gibt an, wie weit die gelbe Kiste nach rechts soll.\n\n[short 9]'
    })
    levels.setBundle('Multi Sort', new Bundle()).setText('hints', {
        en: 'Come Together for yellows, The Stacker for blues. Go forward until you find a crate. If blue, move it one slot further and come all the way back (using the stack) empty handed. If yellow, bring it back and drop it. Repeat.\n\n[short 11]',
        de: '<i>Come Together</i> für Gelb, <i>The Stacker</i> für Blau. Gehe vorwärts bis du eine Kiste findest. Wenn blau, dann eins weiter und dann ohne Kiste alles zurück (mit dem Aufruf-Stack). Wenn gelb, dann bring sie zurück und stell sie hin. Wiederhole.\n\n[short 11]'
    })
    //TODO : More translation needed!
    levels.setBundle('Divide by two', new Bundle()).setText('hints', {
        en: 'Wind up the stack for every two crates. Move one crate back each time it unwinds.\n\n[short 12]',
        de: 'Wickle den Stapel für alle zwei Kisten ab. Bewege jedes Mal eine Kiste zurück, wenn sie sich abwickelt.\n\n[short 12]'
    })
    levels.setBundle('The Merger', new Bundle()).setText('hints', {
        en: 'Use the stack once in each blue, and unwind it in each red.\n\n[short 6].',
        de: 'Verwende den Stapel einmal für jede Blaue Kiste, und stell es bei jeder roten Kiste ab.\n\n[short 6].'
    })
    levels.setBundle('Even the Odds', new Bundle()).setText('hints', {
        en: 'If the pile has an odd number of crates, leave one crate behind, otherwise move all of them. Use a sequence of moves that undoes itself when repeated to move the crates right, and make sure to execute it an even number of times.\n\n[short 10].',
        de: 'Wenn der Stapel eine ungerade Zahl von Kisten hat, lass eine Kiste zurück, ansonst bewegst du alle. Verwende eine Folge von Bewegungen, die sich, wenn wiederholt, aufmacht, um die rechten Kisten zu bewegen und um sicher zu gehen, dass es eine gerade Anzahl Durchführungen gibt.\n\n[short 10].'
    })
    levels.setBundle('Genetic Code', new Bundle()).setText('hints', {
        en: 'The left pile gives instructions for how to construct the right pile. Wind up the entire stack on the left and unwind on the right.\n\n[short 17].',
        de: 'Der linke Stapel erteilt Weisungen dafür, wie man den rechten Stapel baut. Wickle den kompletten Stapel links ab und stellen ihn rechts ab.\n\n[short 17].'
    })
    levels.setBundle('Multi Sort 2', new Bundle()).setText('hints', {
        en: 'Go over each pile and either pick up conditional on none if over the even slots, or drop conditional on the corresponding color if over the odd slots.\n\n[short 17].',
        de: 'Geh durch jeden Stapel und entweder nimmst du keine Kiste (bei gleicher Anzahl) oder beim Fall der entprechenden Farbe wenn du über die sonderbaren Ablagefächer gehst.\n\n[short 17].'
    })
    levels.setBundle('The Swap', new Bundle()).setText('hints', {
        en: 'Merge the piles in the middle, change parity, and unmerge.\n\n[short 10].',
        de: 'Füg die Stapel in der Mitte zusammen und ändere die gerade Anzahl und nimm sie auseinander.\n\n[short 10].'
    })
    levels.setBundle('Restoring Order', new Bundle()).setText('hints', {
        en: 'For each pile move the reds one slot to the right and the blues one slot to the left, but make sure to wind up a stack for the blues so that you can put them back afterwards. Repeat for each pile.\n\n[short 16].',
        de: 'Für jeden Stapel bewege die roten Kisten einen Platz nach rechts und die blauen Kisten nach links, aber stell sicher, dass du jeden Stapel durchgest, so dass du sie später alle zurückstellen kannst. Wiederholen für jeden Stapel.\n\n[short 16].'
    })
    levels.setBundle('Changing Places', new Bundle()).setText('hints', {
        en: 'Switch each pair of piles, in place. First move the left pile to the right, winding up the stack. Then move all crates to the left slot. Finally, unwind the stack moving a crate to the right each time.\n\n[short 17].',
        de: 'Wechsle den Platz von jedem Stapel. Bewege zuerst den linken Stapel nach rechts, wickle den Stapel auf. Dann bewegst du alle Kisten zum linken Ablagefach. Wickle schließlich den Stapel ab und bewegen jeweils eine Kiste nach rechts.\n\n[short 17].'
    })
    levels.setBundle('Palette Swap', new Bundle()).setText('hints', {
        en: 'Go left and go right. Each time you do so, wind up the stack. When no more crates are left, unwind the stack going left and going right. Repeat. \n\n[short 15].',
        de: 'Geh nach links und rechts. Jedes Mal wenn du dies machst, wickelst du den Stapel ab. Wenn keine Kisten mehr übrig sind, wickelst du den Stapel ab und gehst nach links und dann nach rechts. Wiederhol das Ganze. \n\n[short 15].'
    })
    levels.setBundle('Mirror 2', new Bundle()).setText('hints', {
        en: 'Move the top crate of the 2nd pile one slot to the right, and bring the left pile all the way to the right.\n\n[short 12].',
        de: 'Bewege die oberste Kiste des 2. Stapels ein Ablagefach nach rechts und bring den linken Stapel den ganzen Weg nach rechts.\n\n[short 12].'
    })
    levels.setBundle('Changing Places 2', new Bundle()).setText('hints', {
        en: 'As in Changing Places, swap piles. Do that once for each pair of consecutive piles and you\'re done.\n\n[short 16].',
        de: 'Wie im Level Changing Places, tauschst die Stapel. Mach das einmal für jedes aufeinanderfolgende Paar.\n\n[short 16].'
    })
    levels.setBundle('Vertical Sort', new Bundle()).setText('hints', {
        en: 'Draw on ideas from previous sort levels.',
        de: 'Stütz dich sich auf Ideen von vorherigen Sortierlevels.'
    })
    levels.setBundle('Count in Binary', new Bundle()).setText('hints', {
        en: 'Count up all the numbers in binary: 1, 10, 11, 100,...',
        de: 'Zähl alle Zahlen in binär zusammen: 1, 10, 11, 100, ...'
    })
    levels.setBundle('Parting the Sea', new Bundle()).setText('hints', {
        en: '<i>You are on your own.</i>',
        de: '<i>Du bist auf dich alleine gestellt.</i>'
    })
    levels.setBundle('The Trick', new Bundle()).setText('hints', {
        en: 'Bring the right pile to the middle, then the left pile to the middle. Finally unmerge the piles to their respective sides. \n\n[short 11].',
        de: 'Bring zuerst den richtigen Stapel zur Mitte und dann den linken Stapel. Sortiere so, dass die Stapel zu ihrer richtigen Seite kommen. \n\n[short 11].'
    })
}
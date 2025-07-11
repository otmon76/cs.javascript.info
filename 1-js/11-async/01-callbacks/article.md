

# Úvod: callbacky

```warn header="Ve zdejších příkladech používáme metody prohlížeče"
Abychom demonstrovali použití callbacků, příslibů a jiných abstraktních konceptů, budeme používat některé metody prohlížeče: jmenovitě načítání skriptů a provádění jednoduchých manipulací s dokumentem.

Jestliže tyto metody neznáte a jejich používání v příkladech je pro vás matoucí, možná si budete chtít přečíst několik kapitol z [další části](/document) tutoriálu.

Snažíme se však, aby všechno bylo jasné. Z prohlížeče tady nebude nic příliš složitého.
```

Hostitelská prostředí JavaScriptu poskytují mnoho funkcí, které nám umožňují naplánovat *asynchronní* akce. Jinými slovy akce, které spustíme nyní, ale dokončí se až později.

Například jedna taková funkce je `setTimeout`.

Ze skutečného světa existují i jiné příklady asynchronních akcí, např. načítání skriptů a modulů (vysvětlíme je v dalších kapitolách).

Podívejme se na funkci `načtiSkript(zdroj)`, která načte skript ze zadaného zdroje `zdroj`:

```js
function načtiSkript(zdroj) {
  // vytvoří značku <script> a připojí ji na stránku
  // to způsobí, že se skript začne načítat ze zadaného zdroje, a až bude kompletní, spustí se
  let skript = document.createElement('script');
  skript.src = zdroj;
  document.head.append(skript);
}
```

Funkce vloží do dokumentu novou, dynamicky vytvořenou značku `<script src="…">` se zadaným zdrojem `zdroj` v `src`. Prohlížeč jej začne automaticky načítat, a až skript bude kompletní, spustí jej.

Tuto funkci můžeme používat následovně:

```js
// načte skript ze zadané cesty a spustí ho
načtiSkript('/moje/skript.js');
```

Skript se spustí „asynchronně“, začne se tedy načítat okamžitě, ale spustí se až později, když už funkce skončila.

Pokud je za `načtiSkript(…)` nějaký kód, nebude čekat, než načítání skriptu skončí.

```js
načtiSkript('/moje/skript.js');
// kód za funkcí načtiSkript
// nepočká, než načítání skriptu skončí
// ...
```

Řekněme, že skript potřebujeme použít hned, jakmile se načte. Skript deklaruje nové funkce a my je chceme spustit.

Pokud to však uděláme ihned po volání `načtiSkript(…)`, nebude to fungovat:

```js
načtiSkript('/moje/skript.js'); // skript obsahuje "function nováFunkce() {…}"

*!*
nováFunkce(); // taková funkce neexistuje!
*/!*
```

Pochopitelně, prohlížeč pravděpodobně neměl dost času na načtení skriptu. Funkce `načtiSkript` nám tedy zatím neposkytuje způsob, jak vystopovat dokončení načítání. Skript se načte a nakonec se spustí, to je vše. My bychom však rádi věděli, kdy se to stane, abychom ze skriptu mohli používat nové funkce a proměnné.

Přidejme jako druhý argument funkce `načtiSkript` funkci `callback`, která by se měla spustit, až se skript načte:

```js
function načtiSkript(zdroj, *!*callback*/!*) {
  let skript = document.createElement('script');
  skript.src = zdroj;

*!*
  skript.onload = () => callback(skript);
*/!*

  document.head.append(skript);
}
```

Událost `onload` je popsána v článku <info:onload-onerror#loading-a-script>. V zásadě spustí funkci poté, co je skript načten a proveden.

Když nyní chceme volat nové funkce ze skriptu, měli bychom to uvést v callbacku:

```js
načtiSkript('/moje/skript.js', function() {
  // callback se spustí po načtení skriptu
  nováFunkce(); // takže nyní to funguje
  ...
});
```

Myšlenka je taková: druhý argument je funkce (zpravidla anonymní), která se spustí, až bude akce dokončena.

Zde je spustitelný příklad se skutečným skriptem:

```js run
function načtiSkript(zdroj, callback) {
  let skript = document.createElement('script');
  skript.src = zdroj;
  skript.onload = () => callback(skript);
  document.head.append(skript);
}

*!*
načtiSkript('https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.2.0/lodash.js', skript => {
  alert(`Hurá, skript ${skript.src} se načetl`);
  alert( _ ); // _ je funkce deklarovaná v načteném skriptu
});
*/!*
```

Tento styl asynchronního programování se nazývá „založený na callbacku“ („callback-based“). Funkce, která něco provádí asynchronně, by měla poskytovat argument `callback`, do něhož předáme funkci, která se má spustit, až bude původní funkce hotová.

Zde jsme to udělali ve funkci `načtiSkript`, ale samozřejmě je to obecný přístup.

## Callback v callbacku

Jak můžeme načíst dva skripty za sebou: napřed první a po něm druhý?

Přirozené řešení by bylo umístit druhé volání funkce `načtiSkript` do callbacku, například:

```js
načtiSkript('/moje/skript.js', function(skript) {

  alert(`Hurá, ${skript.src} se načetl, teď načteme další`);

*!*
  načtiSkript('/my/script2.js', function(skript) {
    alert(`Hurá, druhý skript se načetl`);
  });
*/!*

});
```

Poté, co skončí vnější funkce `načtiSkript`, callback vyvolá vnitřní.

Co kdybychom chtěli ještě další skript?

```js
načtiSkript('/moje/skript.js', function(skript) {

  načtiSkript('/my/script2.js', function(skript) {

*!*
    načtiSkript('/my/script3.js', function(skript) {
      // ...pokračujeme, dokud se nenačtou všechny skripty
    });
*/!*

  });

});
```

Každá nová akce je tedy uvnitř callbacku. To je vhodné pro několik akcí, ale ne pro větší počet. Brzy tedy uvidíme další varianty.

## Ošetřování chyb

V uvedených příkladech jsme nebrali v úvahu chyby. Co když načítání skriptu selže? Náš callback by měl být schopen na to reagovat.

Zde je vylepšená verze funkce `načtiSkript`, která stopuje chyby při načítání:

```js
function načtiSkript(zdroj, callback) {
  let skript = document.createElement('script');
  skript.src = zdroj;

*!*
  skript.onload = () => callback(null, skript);
  skript.onerror = () => callback(new Error(`Chyba načítání skriptu pro ${zdroj}`));
*/!*

  document.head.append(skript);
}
```

Funkce volá `callback(null, skript)` při úspěšném načtení a `callback(chyba)` jinak.

Použití:
```js
načtiSkript('/moje/skript.js', function(chyba, skript) {
  if (chyba) {
    // ošetření chyby
  } else {
    // skript úspěšně načten
  }
});
```

Opět jsme pro funkci `načtiSkript` použili způsob, jaký je ve skutečnosti poměrně běžný. Nazývá se styl „callbacku s chybou na prvním místě“ („error-first callback“).

Konvence je:
1. První argument funkce `callback` je rezervován pro chybu, pokud nějaká nastane. Pak se volá `callback(chyba)`.
2. Druhý argument (a případně další, jsou-li zapotřebí) je pro úspěšný výsledek. Pak se volá `callback(null, výsledek1, výsledek2…)`.

Jediná funkce `callback` se tedy používá jak pro hlášení chyb, tak pro další předání výsledků.

## Pyramida zkázy

Na první pohled to vypadá jako životaschopný přístup k asynchronnímu kódování. A nepochybně jím také je. Pro jedno nebo možná dvě vnořená volání to vypadá dobře.

Avšak pro vícenásobné asynchronní akce, které následují jedna po druhé, budeme mít kód podobný tomuto:

```js
načtiSkript('1.js', function(chyba, skript) {

  if (chyba) {
    ošetřiChybu(chyba);
  } else {
    // ...
    načtiSkript('2.js', function(chyba, skript) {
      if (chyba) {
        ošetřiChybu(chyba);
      } else {
        // ...
        načtiSkript('3.js', function(chyba, skript) {
          if (chyba) {
            ošetřiChybu(chyba);
          } else {
  *!*
            // ...pokračujeme, dokud se nenačtou všechny skripty (*)
  */!*
          }
        });

      }
    });
  }
});
```

V uvedeném kódu:
1. Načteme `1.js`, pak pokud nenastala chyba...
2. Načteme `2.js`, pak pokud nenastala chyba...
3. Načteme `3.js`, pak pokud nenastala chyba -- uděláme něco jiného `(*)`.

Když se volání budou stále vnořovat, kód bude stále hlubší a jeho údržba čím dál obtížnější, zvláště pokud místo `...` máme skutečný kód, který může obsahovat další cykly, podmíněné příkazy a podobně.

Tomu se někdy říká „callbackové peklo“ nebo „pyramida zkázy“.

<!--
načtiSkript('1.js', function(chyba, skript) {
  if (chyba) {
    ošetřiChybu(chyba);
  } else {
    // ...
    načtiSkript('2.js', function(chyba, skript) {
      if (chyba) {
        ošetřiChybu(chyba);
      } else {
        // ...
        načtiSkript('3.js', function(chyba, skript) {
          if (chyba) {
            ošetřiChybu(chyba);
          } else {
            // ...
          }
        });
      }
    });
  }
});
-->

![](callback-hell.svg)

S každou další asynchronní akcí se tato „pyramida“ vnořených volání bude protahovat směrem doprava a brzy se vymkne kontrole.

Tento způsob kódování tedy není příliš vhodný.

Můžeme se tento problém pokusit utlumit tím, že vložíme každou akci do samostatné funkce, například:

```js
načtiSkript('1.js', krok1);

function krok1(chyba, skript) {
  if (chyba) {
    ošetřiChybu(chyba);
  } else {
    // ...
    načtiSkript('2.js', krok2);
  }
}

function krok2(chyba, skript) {
  if (chyba) {
    ošetřiChybu(chyba);
  } else {
    // ...
    načtiSkript('3.js', krok3);
  }
}

function krok3(chyba, skript) {
  if (chyba) {
    ošetřiChybu(chyba);
  } else {
    // ...pokračujeme, dokud se nenačtou všechny skripty (*)
  }
}
```

Vidíte? Dělá totéž a neobsahuje žádné hluboké vnořování, protože jsme každou akci umístili do oddělené funkce na nejvyšší úrovni.

Funguje to, ale kód nyní vypadá jako roztrhané prostěradlo. Špatně se čte a pravděpodobně jste si všimli, že člověk musí při jeho čtení přeskakovat očima mezi jednotlivými částmi. To je nepohodlné, zvláště pokud čtenář tento kód nezná a neví, kam se má podívat.

Navíc všechny funkce nazvané `krok*` jsou na jedno použití, byly vytvořeny jen proto, abychom se vyhnuli „pyramidě zkázy“. Mimo řetězec akcí je nikdo používat nebude. Zavlékáme tedy trochu nepořádku do jmenného prostoru.

Chtěli bychom mít něco lepšího.

Naštěstí existují i jiné způsoby, jak se takovým pyramidám vyhnout. Jedním z nejlepších je používání „příslibů“, které popíšeme v následující kapitole.

# Iterovatelné objekty

*Iterovatelné* objekty jsou zobecněním polí. Je to koncept, který nám umožňuje učinit kterýkoli objekt použitelným v cyklu `for..of`.

Jistě, pole jsou iterovatelná. Existuje však mnoho dalších vestavěných objektů, které jsou rovněž iterovatelné. Například řetězce jsou také iterovatelné.

Jestliže objekt není technicky pole, ale představuje kolekci (seznam, množinu) nějakých prvků, pak je `for..of` skvělá syntaxe, jak tyto prvky procházet. Podívejme se tedy, jak ji zprovoznit.


## Symbol.iterator

Koncept iterovatelných objektů můžeme snadno pochopit tak, že si vytvoříme vlastní.

Například máme objekt, který sice není pole, ale zdá se být vhodný pro `for..of`.

Třeba objekt `rozsah`, který představuje interval čísel:

```js
let rozsah = {
  začátek: 1,
  konec: 5
};

// Chceme, aby for..of fungovalo:
// for(let číslo of rozsah) ... číslo=1,2,3,4,5
```

Abychom učinili objekt `rozsah` iterovatelným (a tím zprovoznili `for..of`), musíme do tohoto objektu přidat metodu nazvanou `Symbol.iterator` (speciální vestavěný symbol právě pro tento účel).

1. Když `for..of` začne, jedenkrát tuto metodu zavolá (nebo ohlásí chybu, není-li nalezena). Metoda musí vracet *iterátor* -- objekt obsahující metodu `next`.
2. Nadále `for..of` pracuje *pouze s tímto vráceným objektem*.
3. Když `for..of` chce další hodnotu, volá na tomto objektu `next()`.
4. Výsledek `next()` musí mít tvar `{done: Boolean, value: cokoli}`, kde `done=true` znamená, že cyklus má skončit, v opačném případě je `value` jeho další hodnotou.

Zde je úplná implementace objektu `rozsah` s komentáři:

```js run
let rozsah = {
  začátek: 1,
  konec: 5
};

// 1. volání for..of nejprve zavolá tuto funkci
rozsah[Symbol.iterator] = function() {

  // ...tato funkce vrátí objekt iterátoru:
  // 2. Od této chvíle for..of pracuje jen s níže uvedeným objektem iterátoru a ptá se ho na další hodnoty
  return {
    aktuální: this.začátek,
    poslední: this.konec,

    // 3. next() je volána cyklem for..of při každé iteraci
    next() {
      // 4. měla by vrátit hodnotu jako objekt {done:..., value :...}
      if (this.aktuální <= this.poslední) {
        return { done: false, value: this.aktuální++ };
      } else {
        return { done: true };
      }
    }
  };
};

// teď to funguje!
for (let číslo of rozsah) {
  alert(číslo); // 1, pak 2, 3, 4, 5
}
```

Prosíme všimněte si důležité vlastnosti iterovatelných objektů: jednotlivé záležitosti jsou odděleny.

- Sám objekt `rozsah` nemá metodu `next()`.
- Místo toho se voláním `rozsah[Symbol.iterator]()` vytvoří jiný objekt, tzv. „iterátor“, a hodnoty pro iteraci generuje jeho metoda `next()`.

Objekt iterátoru je tedy oddělen od objektu, nad nímž se iteruje.

Technicky je můžeme spojit a použít jako iterátor samotný `rozsah`, abychom kód zjednodušili.

Třeba takto:

```js run
let rozsah = {
  začátek: 1,
  konec: 5,

  [Symbol.iterator]() {
    this.aktuální = this.začátek;
    return this;
  },

  next() {
    if (this.aktuální <= this.konec) {
      return { done: false, value: this.aktuální++ };
    } else {
      return { done: true };
    }
  }
};

for (let číslo of rozsah) {
  alert(číslo); // 1, pak 2, 3, 4, 5
}
```

Nyní `rozsah[Symbol.iterator]()` vrátí samotný objekt `rozsah`: ten obsahuje potřebnou metodu `next()` a pamatuje si aktuální krok iterace v `this.aktuální`. Je to kratší? Ano. A někdy je to i vhodné.

Nevýhodou je, že nyní nemůžeme mít dva cykly `for..of`, které budou nad tímto objektem probíhat současně: sdílely by stav iterace, protože iterátor je pouze jeden -- samotný objekt. Ale dva paralelní cykly `for..of` jsou vzácností, dokonce i v asynchronních scénářích.

```smart header="Nekonečné iterátory"
Je možné vytvářet i nekonečné iterátory. Například `rozsah` se stane nekonečným pro `rozsah.konec = Infinity`. Nebo můžeme vytvořit iterovatelný objekt, který bude generovat nekonečnou posloupnost pseudonáhodných čísel. I ten může být užitečný.

Na metodu `next` nejsou kladena žádná omezení, může vracet další a další hodnoty, to je normální.

Samozřejmě cyklus `for..of` nad takovým iterovatelným objektem by byl nekonečný. Vždy ho však můžeme zastavit příkazem `break`.
```


## Řetězec je iterovatelný

Nejčastěji používané iterovatelné objekty jsou pole a řetězce.

U řetězce cyklus `for..of` prochází jeho znaky:

```js run
for (let znak of "test") {
  // spustí se 4-krát: pro každý znak jednou
  alert( znak ); // t, pak e, pak s, pak t
}
```

Funguje to korektně i se zástupnými páry!

```js run
let řetězec = '𝒳😂';
for (let znak of řetězec) {
    alert( znak ); // 𝒳, a pak 😂
}
```

## Explicitní volání iterátoru

Abychom tomu hlouběji porozuměli, podíváme se, jak použít iterátor explicitně.

Budeme iterovat nad řetězcem přesně stejným způsobem jako `for..of`, ale přímými voláními. Tento kód vytvoří řetězcový iterátor a získá z něj hodnoty „ručně“:

```js run
let řetězec = "Ahoj";

// provádí totéž jako
// for (let znak of řetězec) alert(znak);

*!*
let iterator = řetězec[Symbol.iterator]();
*/!*

while (true) {
  let výsledek = iterator.next();
  if (výsledek.done) break;
  alert(výsledek.value); // vypíše znaky jeden po druhém
}
```

Tento přístup potřebujeme jen vzácně, ale dává nám více kontroly nad procesem než `for..of`. Například můžeme proces iterace rozdělit: trochu iterovat, pak to přerušit, udělat něco jiného a pak iteraci obnovit.

## Iterovatelné objekty a objekty podobné polím [#array-like]

Tyto dva oficiální pojmy vypadají podobně, ale jsou zcela odlišné. Prosíme ujistěte se, že jim dobře rozumíte, abyste předešli zmatkům.

- *Iterovatelné objekty* jsou objekty, které implementují metodu `Symbol.iterator`, jak je popsáno výše.
- *Objekty podobné polím (array-like)* jsou objekty, které mají indexy a vlastnost `length` (délku), takže vypadají jako pole.

Když používáme JavaScript pro praktické úkoly v prohlížeči nebo v kterémkoli jiném prostředí, můžeme se setkat s objekty, které jsou iterovatelné, podobné polím, nebo obojí.

Například řetězce jsou jak iterovatelné (funguje na nich `for..of`), tak podobné polím (mají číselné indexy a vlastnost `length`).

Iterovatelný objekt však nemusí být podobný poli. A naopak, objekt podobný poli nemusí být iterovatelný.

Například `rozsah` ve výše uvedeném příkladu je iterovatelný, ale ne podobný poli, jelikož nemá indexované vlastnosti a `length`.

A zde je objekt, který je podobný poli, ale ne iterovatelný:

```js run
let objektPodobnýPoli = { // má indexy a length => je podobný poli
  0: "Ahoj",
  1: "světe",
  length: 2
};

*!*
// Chyba (objekt neobsahuje Symbol.iterator)
for (let prvek of objektPodobnýPoli) {}
*/!*
```

Jak iterovatelné objekty, tak objekty podobné polím zpravidla *nejsou pole*, tedy nemají `push`, `pop` atd. To je poněkud nepohodlné, když takový objekt máme a chceme s ním pracovat jako s polem. Například bychom chtěli pracovat s objektem `rozsah` pomocí metod polí. Jak toho docílit?

## Array.from

Existuje univerzální metoda [Array.from](mdn:js/Array/from), která přijímá iterovatelnou nebo poli podobnou hodnotu a vytvoří z ní „opravdové“ pole `Array`. Na tom pak můžeme volat metody polí.

Příklad:

```js run
let objektPodobnýPoli = {
  0: "Ahoj",
  1: "světe",
  length: 2
};

*!*
let pole = Array.from(objektPodobnýPoli); // (*)
*/!*
alert(pole.pop()); // světe (metoda funguje)
```

`Array.from` na řádku `(*)` vezme objekt, prozkoumá, zda je iterovatelný nebo podobný poli, a pak vyrobí nové pole a zkopíruje do něj všechny jeho prvky.

Pro iterovatelný objekt se děje totéž:

```js run
// předpokládáme, že rozsah vezmeme z výše uvedeného příkladu
let pole = Array.from(rozsah);
alert(pole); // 1,2,3,4,5 (konverze pole pomocí toString funguje)
```

Úplná syntaxe `Array.from` nám také umožňuje poskytnout nepovinnou „mapovací“ funkci:
```js
Array.from(obj[, mapFn, thisArg])
```

Nepovinný druhý argument `mapFn` může být funkce, která bude aplikována na každý prvek, než bude přidán do pole, a `thisArg` nám umožňuje nastavit v této funkci `this`.

Příklad:

```js run
// předpokládáme, že rozsah vezmeme z výše uvedeného příkladu

// každé číslo umocníme na druhou
let pole = Array.from(rozsah, číslo => číslo * číslo);

alert(pole); // 1,4,9,16,25
```

Zde pomocí `Array.from` přetvoříme řetězec na pole znaků:

```js run
let řetězec = '𝒳😂';

// rozdělí řetězec na pole znaků
let znaky = Array.from(řetězec);

alert(znaky[0]); // 𝒳
alert(znaky[1]); // 😂
alert(znaky.length); // 2
```

Na rozdíl od `řetězec.split` tato metoda využívá iterovatelnost řetězce, a proto, stejně jako `for..of`, funguje korektně se zástupnými páry.

Technicky zde provádí totéž jako:

```js run
let řetězec = '𝒳😂';

let znaky = []; // Array.from interně vykonává stejný cyklus
for (let znak of řetězec) {
  znaky.push(znak);
}

alert(znaky);
```

...Ale je to kratší.

Můžeme na ní dokonce postavit metodu `slice`, která bude rozpoznávat zástupné páry:

```js run
function slice(řetězec, začátek, konec) {
  return Array.from(řetězec).slice(začátek, konec).join('');
}

let řetězec = '𝒳😂𩷶';

alert( slice(řetězec, 1, 3) ); // 😂𩷶

// nativní metoda nepodporuje zástupné páry
alert( řetězec.slice(1, 3) ); // nesmysly (dvě části z různých zástupných párů)
```


## Shrnutí

Objekty, které lze použít ve `for..of`, se nazývají *iterovatelné*.

- Technicky musejí iterovatelné objekty implementovat metodu s názvem `Symbol.iterator`.
    - Výsledek metody `obj[Symbol.iterator]()` se nazývá *iterátor*. Řídí další iterační proces.
    - Iterátor musí obsahovat metodu jménem `next()`, která vrací objekt `{done: Boolean, value: cokoli}`, v němž `done:true` oznamuje konec iteračního procesu, jinak `value` je další hodnota.
- Metoda `Symbol.iterator` je cyklem `for..of` volána automaticky, ale můžeme ji volat i přímo.
- Metodu `Symbol.iterator` implementují i vestavěné iterovatelné objekty, např. řetězce nebo pole.
- Řetězcový iterátor rozpoznává zástupné páry.

Objekty, které mají indexované vlastnosti a vlastnost `length`, se nazývají *podobné polím*. Takové objekty mohou mít i jiné vlastnosti a metody, ale postrádají vestavěné metody polí.

Podíváme-li se do specifikace, uvidíme, že většina vestavěných metod předpokládá, že pracují s iterovatelnými nebo polím podobnými objekty místo „opravdových“ polí, protože je to abstraktnější.

`Array.from(obj[, mapFn, thisArg])` vytvoří opravdové pole `Array` z iterovatelného nebo poli podobného objektu `obj`. Na ně pak můžeme používat metody polí. Nepovinné argumenty `mapFn` a `thisArg` nám umožňují na každý prvek aplikovat funkci.
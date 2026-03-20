var url = "https://crm.skch.cz/ajax0/procedure.php"
var lideGlobal = []
var typyGlobal = []

async function getJson(cmd) {
  var res = await fetch(url + "?cmd=" + cmd, {
    method: "GET",
    credentials: "include"
  })
  if (!res.ok) throw new Error(cmd + " HTTP " + res.status)
  return await res.json()
}

function naPole(data) {
  if (Array.isArray(data)) return data
  return Object.values(data)
}

function ulozCookie(nazev, hodnota, dny) {
  var datum = new Date()
  datum.setTime(datum.getTime() + dny * 24 * 60 * 60 * 1000)
  document.cookie = nazev + "=" + encodeURIComponent(hodnota) + "; expires=" + datum.toUTCString() + "; path=/"
}

function nactiCookie(nazev) {
  var hledam = nazev + "="
  var pole = document.cookie.split(";")
  for (var i = 0; i < pole.length; i++) {
    var cast = pole[i].trim()
    if (cast.indexOf(hledam) === 0) {
      return decodeURIComponent(cast.substring(hledam.length))
    }
  }
  return ""
}

function ulozPoslednihoUzivatele(id) {
  localStorage.setItem("posledniUzivatel", id)
  sessionStorage.setItem("posledniUzivatel", id)
  ulozCookie("posledniUzivatel", id, 30)
}

function nactiPoslednihoUzivatele() {
  return sessionStorage.getItem("posledniUzivatel")
    || localStorage.getItem("posledniUzivatel")
    || nactiCookie("posledniUzivatel")
    || ""
}

function naplnUzivatele(lide) {
  var select = document.getElementById("uzivatel")
  select.innerHTML = ""

  for (var i = 0; i < lide.length; i++) {
    var option = document.createElement("option")
    option.value = lide[i].ID
    option.textContent = lide[i].name
    select.appendChild(option)
  }

  var posledni = nactiPoslednihoUzivatele()
  if (posledni !== "") {
    select.value = posledni
  }
}

function naplnDrinky(typy) {
  var drinky = document.getElementById("drinky")
  drinky.innerHTML = ""

  for (var i = 0; i < typy.length; i++) {
    var box = document.createElement("div")
    box.className = "drinkBox"

    var text = document.createElement("div")
    text.className = "drinkNazev"
    text.textContent = typy[i].typ

    var input = document.createElement("input")
    input.type = "number"
    input.min = "0"
    input.value = "0"
    input.dataset.typ = typy[i].typ

    box.appendChild(text)
    box.appendChild(input)
    drinky.appendChild(box)
  }
}

async function nacist() {
  var lide = naPole(await getJson("getPeopleList"))
  var typy = naPole(await getJson("getTypesList"))

  lideGlobal = lide
  typyGlobal = typy

  naplnUzivatele(lide)
  naplnDrinky(typy)
}

async function odesli() {
  var tlacitko = document.getElementById("odeslatTl")
  var stav = document.getElementById("stav")
  tlacitko.disabled = true
  stav.textContent = ""

  try {
    var user = document.getElementById("uzivatel").value
    var vstupy = document.querySelectorAll("#drinky input")

    ulozPoslednihoUzivatele(user)

    var drinky = []

    for (var i = 0; i < vstupy.length; i++) {
      drinky.push({
        type: vstupy[i].dataset.typ,
        value: Number(vstupy[i].value)
      })
    }

    var data = {
      user: String(user),
      drinks: drinky
    }

    var res = await fetch(url + "?cmd=saveDrinks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(data)
    })

    var odpoved = await res.json()

    if (odpoved.msg == 1) {
      stav.textContent = "Data byla poslana."
    } else {
      stav.textContent = "Server vratil chybu."
    }
  } catch (e) {
    stav.textContent = "Chyba pri odeslani."
  }

  tlacitko.disabled = false
}

document.getElementById("uzivatel").addEventListener("change", function () {
  ulozPoslednihoUzivatele(this.value)
})

document.getElementById("odeslatTl").onclick = odesli

nacist()
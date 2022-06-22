const { ipcRenderer } = require("electron")

// ipcRenderer.send("create_lobby")

VanillaTilt.init(document.querySelectorAll(".card"), {
  max: 10,
  speed: 200,
  glare: true,
  "max-glare": 0.3
})

const allArrows = document.getElementsByClassName("arrow")

for (var i = 0; i < allArrows.length; i++) {
  allArrows[i].addEventListener("click", (e) => {
    const direction = e.target.classList[1]
    const allCards = document.getElementsByClassName("card")
    let activeElementId = undefined
    
    for (var i = 0; i < allCards.length; i++) {
      if (allCards[i].classList[1]) {
        activeElementId = i
        break
      }
    }

    for (var i = 0; i < allCards.length; i++) {
      allCards[i].className = "card"
      allCards[i].style = "display: none;"
    }

    if (direction == "right") {
      const id = activeElementId + 1 == allCards.length? 0:activeElementId + 1
      allCards[id].className = "card current"
      allCards[id].style = "display: flex;"
    } else {
      const id = activeElementId - 1 == -1? allCards.length-1:activeElementId - 1
      allCards[id].className = "card current"
      allCards[id].style = "display: flex;"
    }
  })
}

function set_collapsibles() {
  const allColapsibles = document.getElementsByClassName("collapsible")

  for (var i = 0; i < allColapsibles.length; i++) {
    allColapsibles[i].addEventListener("click", function() {
      this.classList.toggle("active")
      var content = this.nextElementSibling
      if (content.style.display === "block") {
        content.style.display = "none"
      } else {
        content.style.display = "block"
      }
    })
  }
}

set_collapsibles()
// stw_crafting_data.js
// Crafting recipes for the requested set of weapons
// Uses 130 max-tier archetypes where appropriate

const CraftingData = {

  // Assault Rifle / SMG / LMG class
  ar_lmg: {
    description: "Assault Rifles, SMGs, and LMGs (most ranged weapons)",
    ammoTypeByCategory: {
      assault: "Medium",
      smg: "Light",
      lmg: "Medium"
    },
    variants: {
      Brightcore: {
        mineral: "Brightcore Ore",
        mineralAmount: 30,
        mechanicalParts: 30,
        activePowercell: 1,
        ore: 11
      },
      Sunbeam: {
        mineral: "Sunbeam Crystal",
        mineralAmount: 30,
        mechanicalParts: 30,
        activePowercell: 1,
        crystals: 11
      }
    }
  },

  // Explosive weapons (rocket/grenade launchers)
  explosive: {
    description: "Explosive weapons (launchers / rockets)",
    ammoType: "Rockets",
    variants: {
      Brightcore: {
        mineral: "Brightcore Ore",
        mineralAmount: 30,
        mechanicalParts: 30,
        activePowercell: 1,
        ore: 11
      },
      Sunbeam: {
        mineral: "Sunbeam Crystal",
        mineralAmount: 30,
        mechanicalParts: 30,
        activePowercell: 1,
        crystals: 11
      }
    }
  },

  // Sniper / Bow class
  sniper_bow: {
    description: "Sniper rifles and bows",
    ammoType: "Heavy",
    variants: {
      Brightcore: {
        mineral: "Brightcore Ore",
        mineralAmount: 30,
        mechanicalParts: 30,
        activePowercell: 1,
        ore: 11
      },
      Sunbeam: {
        mineral: "Sunbeam Crystal",
        mineralAmount: 30,
        mechanicalParts: 30,
        activePowercell: 1,
        crystals: 11
      }
    }
  },

  // Pistols
  pistol: {
    description: "Pistols and sidearms",
    ammoType: "Light",
    variants: {
      Brightcore: {
        mineral: "Brightcore Ore",
        mineralAmount: 30,
        mechanicalParts: 30,
        activePowercell: 1,
        ore: 11
      },
      Sunbeam: {
        mineral: "Sunbeam Crystal",
        mineralAmount: 30,
        mechanicalParts: 30,
        activePowercell: 1,
        crystals: 11
      }
    }
  },

  // Melee weapons
  melee: {
    description: "Melee weapons",
    ammoType: null,
    variants: {
      Brightcore: {
        mineral: "Brightcore Ore",
        mineralAmount: 30,
        mineralPowder: 30,
        twine: 11,
        activePowercell: 1
      },
      Sunbeam: {
        mineral: "Sunbeam Crystal",
        mineralAmount: 30,
        mineralPowder: 30,
        twine: 11,
        activePowercell: 1
      }
    }
  }

};

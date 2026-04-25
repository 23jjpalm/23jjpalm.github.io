const CoinDataStore = (() => {
  const STORAGE_KEYS = {
    coins: "coins",
    bullionEntries: "bullionEntries",
    bills: "bills",
    stories: "coinStories",
    initialized: "coinSiteInitializedV2"
  };

  const DEFAULT_COINS = [
    { id: 1, inventoryId: "C-0001", year: 1877, denomination: "Dime", quantity: 1 },
    { id: 2, inventoryId: "C-0002", year: 1883, denomination: "Dime", quantity: 1 },
    { id: 3, inventoryId: "C-0003", year: 1883, denomination: "Dollar Coin", quantity: 1 },
    { id: 4, inventoryId: "C-0004", year: 1884, denomination: "Dollar Coin", quantity: 1 },
    { id: 5, inventoryId: "C-0005", year: 1903, denomination: "Quarter (Barber)", quantity: 1 },
    { id: 6, inventoryId: "C-0006", year: 1911, denomination: "Half Dollar", quantity: 1 },
    { id: 7, inventoryId: "C-0007", year: 1917, denomination: "Mercury Dime", quantity: 1 },
    { id: 8, inventoryId: "C-0008", year: 1928, denomination: "Buffalo Nickel", quantity: 1 },
    { id: 9, inventoryId: "C-0009", year: 1934, denomination: "Half Dollar", quantity: 1 },
    { id: 10, inventoryId: "C-0010", year: 1935, denomination: "Mercury Dime", quantity: 3 },
    { id: 11, inventoryId: "C-0011", year: 1936, denomination: "Mercury Dime", quantity: 4 },
    { id: 12, inventoryId: "C-0012", year: 1936, denomination: "Buffalo Nickel", quantity: 1 },
    { id: 13, inventoryId: "C-0013", year: 1938, denomination: "Mercury Dime", quantity: 2 },
    { id: 14, inventoryId: "C-0014", year: 1939, denomination: "Mercury Dime", quantity: 4 },
    { id: 15, inventoryId: "C-0015", year: 1940, denomination: "Mercury Dime", quantity: 1 },
    { id: 16, inventoryId: "C-0016", year: 1940, denomination: "Quarter", quantity: 1 },
    { id: 17, inventoryId: "C-0017", year: 1941, denomination: "Mercury Dime", quantity: 5 },
    { id: 18, inventoryId: "C-0018", year: 1941, denomination: "Quarter", quantity: 1 },
    { id: 19, inventoryId: "C-0019", year: 1942, denomination: "Mercury Dime", quantity: 14 },
    { id: 20, inventoryId: "C-0020", year: 1942, denomination: "Quarter", quantity: 2 },
    { id: 21, inventoryId: "C-0021", year: 1943, denomination: "Mercury Dime", quantity: 10 },
    { id: 22, inventoryId: "C-0022", year: 1944, denomination: "Mercury Dime", quantity: 8 },
    { id: 23, inventoryId: "C-0023", year: 1945, denomination: "Mercury Dime", quantity: 5 },
    { id: 24, inventoryId: "C-0024", year: 1946, denomination: "Roosevelt Dime", quantity: 4 },
    { id: 25, inventoryId: "C-0025", year: 1947, denomination: "Roosevelt Dime", quantity: 2 },
    { id: 26, inventoryId: "C-0026", year: 1948, denomination: "Roosevelt Dime", quantity: 2 },
    { id: 27, inventoryId: "C-0027", year: 1948, denomination: "Quarter", quantity: 1 },
    { id: 28, inventoryId: "C-0028", year: 1951, denomination: "Roosevelt Dime", quantity: 1 },
    { id: 29, inventoryId: "C-0029", year: 1952, denomination: "Roosevelt Dime", quantity: 1 },
    { id: 30, inventoryId: "C-0030", year: 1952, denomination: "Half Dollar", quantity: 1 },
    { id: 31, inventoryId: "C-0031", year: 1953, denomination: "Quarter", quantity: 1 },
    { id: 32, inventoryId: "C-0032", year: 1954, denomination: "Roosevelt Dime", quantity: 2 },
    { id: 33, inventoryId: "C-0033", year: 1956, denomination: "Roosevelt Dime", quantity: 1 },
    { id: 34, inventoryId: "C-0034", year: 1957, denomination: "Roosevelt Dime", quantity: 1 },
    { id: 35, inventoryId: "C-0035", year: 1958, denomination: "Quarter", quantity: 1 },
    { id: 36, inventoryId: "C-0036", year: 1959, denomination: "Roosevelt Dime", quantity: 1 },
    { id: 37, inventoryId: "C-0037", year: 1959, denomination: "Quarter", quantity: 1 },
    { id: 38, inventoryId: "C-0038", year: 1961, denomination: "Roosevelt Dime", quantity: 5 },
    { id: 39, inventoryId: "C-0039", year: 1962, denomination: "Roosevelt Dime", quantity: 3 },
    { id: 40, inventoryId: "C-0040", year: 1963, denomination: "Roosevelt Dime", quantity: 4 },
    { id: 41, inventoryId: "C-0041", year: 1963, denomination: "Quarter", quantity: 2 },
    { id: 42, inventoryId: "C-0042", year: 1964, denomination: "Roosevelt Dime", quantity: 13 },
    { id: 43, inventoryId: "C-0043", year: 1964, denomination: "Quarter", quantity: 2 },
    { id: 44, inventoryId: "C-0044", year: 1964, denomination: "Half Dollar", quantity: 2 },
    { id: 45, inventoryId: "C-0045", year: 1966, denomination: "Half Dollar", quantity: 1 },
    { id: 46, inventoryId: "C-0046", year: 1967, denomination: "Half Dollar", quantity: 2 }
  ];

  const DEFAULT_BULLION_ENTRIES = [];
  const DEFAULT_BILLS = [];

  function safeParse(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getCoinSpec(year, denomination) {
    if (denomination === "Fine Silver") return { silverContent: 100, weightGrams: 31.1035 };
    if (denomination === "Buffalo Nickel") return { silverContent: 0, weightGrams: 5.0 };

    if (
      denomination === "Dime" ||
      denomination === "Mercury Dime" ||
      denomination === "Roosevelt Dime"
    ) {
      return { silverContent: 90, weightGrams: 2.5 };
    }

    if (denomination === "Quarter" || denomination === "Quarter (Barber)") {
      return { silverContent: 90, weightGrams: 6.25 };
    }

    if (denomination === "Dollar Coin") {
      return { silverContent: 90, weightGrams: 26.73 };
    }

    if (denomination === "Half Dollar") {
      if (Number(year) === 1966 || Number(year) === 1967) {
        return { silverContent: 40, weightGrams: 11.5 };
      }
      return { silverContent: 90, weightGrams: 12.5 };
    }

    return { silverContent: 0, weightGrams: 0 };
  }

  function getFaceValue(denomination) {
    if (
      denomination === "Dime" ||
      denomination === "Mercury Dime" ||
      denomination === "Roosevelt Dime"
    ) return 0.10;

    if (denomination === "Quarter" || denomination === "Quarter (Barber)") return 0.25;
    if (denomination === "Half Dollar") return 0.50;
    if (denomination === "Dollar Coin") return 1.00;
    if (denomination === "Buffalo Nickel") return 0.05;
    return 0.00;
  }

  function enrichCoin(coin) {
    const spec = getCoinSpec(Number(coin.year), coin.denomination);

    const weightGrams =
      typeof coin.customWeightGrams === "number"
        ? coin.customWeightGrams
        : (typeof coin.weightGrams === "number" ? coin.weightGrams : spec.weightGrams);

    const silverContent =
      typeof coin.customSilverContent === "number"
        ? coin.customSilverContent
        : (typeof coin.silverContent === "number" ? coin.silverContent : spec.silverContent);

    const quantity = Number.isFinite(Number(coin.quantity)) ? Number(coin.quantity) : 1;

    return {
      id: Number(coin.id),
      inventoryId: coin.inventoryId || `C-${String(Number(coin.id)).padStart(4, "0")}`,
      year: Number(coin.year),
      denomination: coin.denomination,
      quantity,
      notes: coin.notes || "",
      weightUnit: coin.weightUnit || "g",
      personalStory: coin.personalStory || "",
      purchasePrice: Number.isFinite(Number(coin.purchasePrice))
        ? Number(coin.purchasePrice)
        : getFaceValue(coin.denomination) * quantity,
      silverContent,
      weightGrams,
      customWeightGrams: typeof coin.customWeightGrams === "number" ? coin.customWeightGrams : null,
      customSilverContent: typeof coin.customSilverContent === "number" ? coin.customSilverContent : null,
      type: "coin"
    };
  }

  function enrichBullion(entry) {
    const quantity = Number.isFinite(Number(entry.quantity)) ? Number(entry.quantity) : 1;
    const weightGrams = Number.isFinite(Number(entry.weightGrams)) ? Number(entry.weightGrams) : 0;

    return {
      id: Number(entry.id),
      inventoryId: entry.inventoryId || `B-${String(Number(entry.id)).padStart(4, "0")}`,
      year: Number.isFinite(Number(entry.year)) ? Number(entry.year) : new Date().getFullYear(),
      denomination: "Fine Silver",
      quantity,
      notes: entry.notes || "",
      personalStory: entry.personalStory || "",
      weightUnit: entry.weightUnit || "oz",
      purchasePrice:
        entry.purchasePrice === "add-later"
          ? "add-later"
          : (Number.isFinite(Number(entry.purchasePrice)) ? Number(entry.purchasePrice) : "add-later"),
      silverContent: Number.isFinite(Number(entry.silverContent)) ? Number(entry.silverContent) : 100,
      weightGrams,
      customWeightGrams: weightGrams,
      type: "bullion"
    };
  }

  function enrichBill(bill) {
    const quantity = Number.isFinite(Number(bill.quantity)) ? Number(bill.quantity) : 1;
    const faceValue = Number.isFinite(Number(bill.faceValue)) ? Number(bill.faceValue) : 0;

    return {
      id: Number(bill.id),
      inventoryId: bill.inventoryId || `N-${String(Number(bill.id)).padStart(4, "0")}`,
      year: Number.isFinite(Number(bill.year)) ? Number(bill.year) : new Date().getFullYear(),
      denomination: bill.denomination || "Bill",
      quantity,
      notes: bill.notes || "",
      personalStory: bill.personalStory || "",
      faceValue,
      purchasePrice: Number.isFinite(Number(bill.purchasePrice))
        ? Number(bill.purchasePrice)
        : faceValue * quantity,
      type: "bill"
    };
  }

  function initializeIfNeeded(force = false) {
    const initialized = localStorage.getItem(STORAGE_KEYS.initialized) === "true";

    if (!initialized || force) {
      const currentStories = safeParse(STORAGE_KEYS.stories, {});

      localStorage.setItem(
        STORAGE_KEYS.coins,
        JSON.stringify(DEFAULT_COINS.map(enrichCoin))
      );

      localStorage.setItem(
        STORAGE_KEYS.bullionEntries,
        JSON.stringify(DEFAULT_BULLION_ENTRIES.map(enrichBullion))
      );

      localStorage.setItem(
        STORAGE_KEYS.bills,
        JSON.stringify(DEFAULT_BILLS.map(enrichBill))
      );

      localStorage.setItem(STORAGE_KEYS.stories, JSON.stringify(currentStories));
      localStorage.setItem(STORAGE_KEYS.initialized, "true");
    }
  }

  function getCoins() {
    initializeIfNeeded();
    return safeParse(STORAGE_KEYS.coins, DEFAULT_COINS).map(enrichCoin);
  }

  function saveCoins(coins) {
    localStorage.setItem(
      STORAGE_KEYS.coins,
      JSON.stringify((coins || []).map(enrichCoin))
    );
  }

  function getBullionEntries() {
    initializeIfNeeded();
    return safeParse(STORAGE_KEYS.bullionEntries, DEFAULT_BULLION_ENTRIES).map(enrichBullion);
  }

  function saveBullionEntries(entries) {
    localStorage.setItem(
      STORAGE_KEYS.bullionEntries,
      JSON.stringify((entries || []).map(enrichBullion))
    );
  }

  function getBills() {
    initializeIfNeeded();
    return safeParse(STORAGE_KEYS.bills, DEFAULT_BILLS).map(enrichBill);
  }

  function saveBills(bills) {
    localStorage.setItem(
      STORAGE_KEYS.bills,
      JSON.stringify((bills || []).map(enrichBill))
    );
  }

  function getStories() {
    initializeIfNeeded();
    return safeParse(STORAGE_KEYS.stories, {});
  }

  function saveStories(stories) {
    localStorage.setItem(STORAGE_KEYS.stories, JSON.stringify(stories || {}));
  }

  function saveStory(key, value) {
    const stories = getStories();
    stories[key] = value;
    saveStories(stories);
  }

  function nextCoinId(coins = getCoins()) {
    return coins.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  }

  function nextBullionId(entries = getBullionEntries()) {
    return entries.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  }

  function nextBillId(bills = getBills()) {
    return bills.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  }

  function nextInventoryId(prefix, items) {
    const numbers = (items || [])
      .map(item => String(item.inventoryId || ""))
      .filter(id => id.startsWith(prefix + "-"))
      .map(id => Number(id.split("-")[1]))
      .filter(Number.isFinite);

    const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
    return `${prefix}-${String(next).padStart(4, "0")}`;
  }

  return {
    STORAGE_KEYS,
    DEFAULT_COINS,
    DEFAULT_BULLION_ENTRIES,
    DEFAULT_BILLS,
    getCoinSpec,
    getFaceValue,
    initializeIfNeeded,
    getCoins,
    saveCoins,
    getBullionEntries,
    saveBullionEntries,
    getBills,
    saveBills,
    getStories,
    saveStories,
    saveStory,
    nextCoinId,
    nextBullionId,
    nextBillId,
    nextInventoryId
  };
})();

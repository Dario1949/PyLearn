let themeColor = $state('#d97706'); // color por defecto (naranja)
let backgroundColor = $state('#1a202c'); // color de fondo por defecto (azul oscuro)
let cardColor = $state('#2d3748'); // color de tarjetas por defecto (gris oscuro)
let textColor = $state('#ffffff'); // color de texto por defecto (blanco)
let currentUser = $state(null);

export function getThemeColor() {
  return themeColor;
}

export function setThemeColor(color) {
  themeColor = color;
  console.log('Guardando color tema:', color, 'para usuario:', currentUser);
  if (currentUser) {
    localStorage.setItem(`theme-color-${currentUser}`, color);
    console.log('Color guardado en localStorage');
  } else {
    console.log('No hay currentUser, no se guarda');
  }
  updateCSSVariables();
}

export function setBackgroundColor(color) {
  backgroundColor = color;
  console.log('Guardando color fondo:', color, 'para usuario:', currentUser);
  if (currentUser) {
    localStorage.setItem(`background-color-${currentUser}`, color);
  }
  updateCSSVariables();
}

export function getBackgroundColor() {
  return backgroundColor;
}

export function setCardColor(color) {
  cardColor = color;
  if (currentUser) {
    localStorage.setItem(`card-color-${currentUser}`, color);
  }
  updateCSSVariables();
}

export function getCardColor() {
  return cardColor;
}

export function setTextColor(color) {
  textColor = color;
  if (currentUser) {
    localStorage.setItem(`text-color-${currentUser}`, color);
  }
  updateCSSVariables();
}

export function getTextColor() {
  return textColor;
}

export function loadThemeForUser(userId, hasColorSelector = false, hasBackgroundSelector = false, hasCardColorSelector = false, hasTextColorSelector = false) {
  currentUser = userId;
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUserId', userId);
    
    const savedColor = localStorage.getItem(`theme-color-${userId}`);
    const savedBg = localStorage.getItem(`background-color-${userId}`);
    const savedCard = localStorage.getItem(`card-color-${userId}`);
    const savedText = localStorage.getItem(`text-color-${userId}`);
    
    console.log('Cargando tema para usuario:', userId);
    console.log('Colores guardados:', { savedColor, savedBg, savedCard, savedText });
    
    if (savedColor) {
      themeColor = savedColor;
      console.log('Color tema cargado:', savedColor);
    }
    if (savedBg) {
      backgroundColor = savedBg;
      console.log('Color fondo cargado:', savedBg);
    }
    if (savedCard) {
      cardColor = savedCard;
      console.log('Color tarjeta cargado:', savedCard);
    }
    if (savedText) {
      textColor = savedText;
      console.log('Color texto cargado:', savedText);
    }
    
    updateCSSVariables();
  }
}

export function resetToDefaultTheme() {
  themeColor = '#d97706';
  backgroundColor = '#1a202c';
  cardColor = '#2d3748';
  textColor = '#ffffff';
  if (currentUser) {
    localStorage.setItem(`theme-color-${currentUser}`, themeColor);
    localStorage.setItem(`background-color-${currentUser}`, backgroundColor);
    localStorage.setItem(`card-color-${currentUser}`, cardColor);
    localStorage.setItem(`text-color-${currentUser}`, textColor);
  }
  updateCSSVariables();
}

export function applyThemePreset(colors) {
  themeColor = colors.theme;
  backgroundColor = colors.background;
  cardColor = colors.card;
  textColor = colors.text;
  
  if (currentUser) {
    localStorage.setItem(`theme-color-${currentUser}`, themeColor);
    localStorage.setItem(`background-color-${currentUser}`, backgroundColor);
    localStorage.setItem(`card-color-${currentUser}`, cardColor);
    localStorage.setItem(`text-color-${currentUser}`, textColor);
  }
  
  updateCSSVariables();
}

export function loadThemeFromStorage() {
  // Función legacy, ahora usar loadThemeForUser
  resetToDefaultTheme();
}

function isLightColor(color) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 128;
}

// Cargar tema inmediatamente desde localStorage para evitar flash
if (typeof window !== 'undefined') {
  // Buscar userId tanto en currentUserId como en auth_user
  let userId = localStorage.getItem('currentUserId');
  if (!userId) {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const user = JSON.parse(authUser);
        userId = user.id;
        localStorage.setItem('currentUserId', userId);
      }
    } catch (e) {}
  }
  
  if (userId) {
    currentUser = userId;
    const savedColor = localStorage.getItem(`theme-color-${userId}`);
    const savedBg = localStorage.getItem(`background-color-${userId}`);
    const savedCard = localStorage.getItem(`card-color-${userId}`);
    const savedText = localStorage.getItem(`text-color-${userId}`);
    
    if (savedColor) themeColor = savedColor;
    if (savedBg) backgroundColor = savedBg;
    if (savedCard) cardColor = savedCard;
    if (savedText) textColor = savedText;
    
    // Aplicar inmediatamente
    setTimeout(() => updateCSSVariables(), 0);
  }
}

// Función para obtener cache de usuario específico
export function getUserThemeCache(userId) {
  if (typeof window === 'undefined') return null;
  
  return {
    themeColor: localStorage.getItem(`theme-color-${userId}`),
    backgroundColor: localStorage.getItem(`background-color-${userId}`),
    cardColor: localStorage.getItem(`card-color-${userId}`),
    textColor: localStorage.getItem(`text-color-${userId}`)
  };
}

// Función para limpiar cache de usuario específico
export function clearUserThemeCache(userId) {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(`theme-color-${userId}`);
  localStorage.removeItem(`background-color-${userId}`);
  localStorage.removeItem(`card-color-${userId}`);
  localStorage.removeItem(`text-color-${userId}`);
}

function updateCSSVariables() {
  if (typeof window === 'undefined') return;
  
  // Crear o actualizar estilo con !important
  let styleElement = document.getElementById('theme-override');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'theme-override';
    document.head.appendChild(styleElement);
  }
  
  const mutedColor = isLightColor(backgroundColor) ? '#6b7280' : '#9ca3af';
  const cardTextColor = isLightColor(cardColor) ? '#000000' : textColor;
  
  styleElement.textContent = `
    :root {
      --primary: ${themeColor} !important;
      --color-primary: ${themeColor} !important;
      --secondary: ${themeColor} !important;
      --accent: ${themeColor} !important;
      --background: ${backgroundColor} !important;
      --color-background: ${backgroundColor} !important;
      --card: ${cardColor} !important;
      --color-card: ${cardColor} !important;
      --foreground: ${textColor} !important;
      --color-foreground: ${textColor} !important;
      --muted: ${mutedColor} !important;
      --muted-foreground: ${mutedColor} !important;
      --card-foreground: ${cardTextColor} !important;
    }
    body {
      background-color: ${backgroundColor} !important;
      color: ${textColor} !important;
    }
    .text-muted { color: ${mutedColor} !important; }
    .text-foreground { color: ${textColor} !important; }
    .text-card-foreground { color: ${cardTextColor} !important; }
  `;
}
// Local Edge Voice Command Router
export const parseVoiceCommand = (text, currentLanguage) => {
  const cleanText = text.toLowerCase().trim();

  // 1. Language change commands
  if (cleanText.includes('english') || cleanText.includes('अंग्रेजी')) {
    return { action: 'LANGUAGE', params: { code: 'en', name: 'English' } };
  }
  if (cleanText.includes('hindi') || cleanText.includes('हिन्दी') || cleanText.includes('हिंदी')) {
    return { action: 'LANGUAGE', params: { code: 'hi', name: 'Hindi' } };
  }
  if (cleanText.includes('kannada') || cleanText.includes('ಕನ್ನಡ')) {
    return { action: 'LANGUAGE', params: { code: 'kn', name: 'Kannada' } };
  }
  if (cleanText.includes('tamil') || cleanText.includes('தமிழ்')) {
    return { action: 'LANGUAGE', params: { code: 'ta', name: 'Tamil' } };
  }
  if (cleanText.includes('telugu') || cleanText.includes('తెలుగు')) {
    return { action: 'LANGUAGE', params: { code: 'te', name: 'Telugu' } };
  }

  // 2. Navigation Routing commands
  // Home
  if (
    cleanText === 'home' || 
    cleanText.includes('go home') || 
    cleanText.includes('मुख्य पृष्ठ') || 
    cleanText.includes('घर') ||
    cleanText.includes('ಮುಖಪುಟ') ||
    cleanText.includes('முகப்பு') ||
    cleanText.includes('హోమ్')
  ) {
    return { action: 'ROUTE', params: { route: 'home', path: '/' } };
  }

  // Back
  if (
    cleanText === 'back' || 
    cleanText.includes('go back') || 
    cleanText.includes('पीछे') || 
    cleanText.includes('हटो') ||
    cleanText.includes('ಹಿಂದಕ್ಕೆ') ||
    cleanText.includes('பின்னால்') ||
    cleanText.includes('వెనుకకు')
  ) {
    return { action: 'ROUTE', params: { route: 'back', path: -1 } };
  }

  // Electricity
  if (
    cleanText.includes('electricity') || 
    cleanText.includes('power') || 
    cleanText.includes('light') || 
    cleanText.includes('बिजली') || 
    cleanText.includes('ವಿದ್ಯುತ್') ||
    cleanText.includes('மின்சார') ||
    cleanText.includes('విద్యుత్')
  ) {
    return { action: 'ROUTE', params: { route: 'electricity', path: '/electricity' } };
  }

  // Water
  if (
    cleanText.includes('water') || 
    cleanText.includes('sewage') || 
    cleanText.includes('पानी') || 
    cleanText.includes('जल') || 
    cleanText.includes('ನೀರು') ||
    cleanText.includes('தண்ணீர்') ||
    cleanText.includes('కుడినీరు') ||
    cleanText.includes('నీటి')
  ) {
    return { action: 'ROUTE', params: { route: 'water', path: '/water' } };
  }

  // Gas
  // Note: matches "gas", "png", "lpg", "गैस"
  if (
    cleanText.includes('gas') || 
    cleanText.includes('png') || 
    cleanText.includes('cylinder') || 
    cleanText.includes('गैस') || 
    cleanText.includes('ಗ್ಯಾಸ್') ||
    cleanText.includes('எரிவாயு') ||
    cleanText.includes('గ్యాస్')
  ) {
    return { action: 'ROUTE', params: { route: 'gas', path: '/gas' } };
  }

  // Waste Management
  if (
    cleanText.includes('waste') || 
    cleanText.includes('garbage') || 
    cleanText.includes('trash') || 
    cleanText.includes('cleanliness') || 
    cleanText.includes('कचरा') || 
    cleanText.includes('सफाई') || 
    cleanText.includes('ತ್ಯಾಜ್ಯ') ||
    cleanText.includes('கழிவு') ||
    cleanText.includes('చెత్త')
  ) {
    return { action: 'ROUTE', params: { route: 'waste', path: '/waste' } };
  }

  // Complaint Register
  if (
    cleanText.includes('complaint') || 
    cleanText.includes('grievance') || 
    cleanText.includes('register') || 
    cleanText.includes('शिकायत') || 
    cleanText.includes('दर्ज') || 
    cleanText.includes('ದೂರು') ||
    cleanText.includes('புகார்') ||
    cleanText.includes('ఫిర్యాదు')
  ) {
    return { action: 'ROUTE', params: { route: 'complaints', path: '/complaints' } };
  }

  // Tracking
  if (
    cleanText.includes('track') || 
    cleanText.includes('status') || 
    cleanText.includes('check complaint') || 
    cleanText.includes('ट्रैक') || 
    cleanText.includes('स्थिति') || 
    cleanText.includes('ಪರಿಶೀಲನೆ') ||
    cleanText.includes('கண்காணிப்பு') ||
    cleanText.includes('స్థితి')
  ) {
    return { action: 'ROUTE', params: { route: 'trackTitle', path: '/track' } };
  }

  // Admin Dashboard
  if (
    cleanText.includes('admin') || 
    cleanText.includes('dashboard') || 
    cleanText.includes('management') || 
    cleanText.includes('एडमिन')
  ) {
    return { action: 'ROUTE', params: { route: 'admin', path: '/admin' } };
  }

  // Mobile Companion
  if (
    cleanText.includes('mobile') || 
    cleanText.includes('companion') || 
    cleanText.includes('phone') || 
    cleanText.includes('मोबाइल')
  ) {
    return { action: 'ROUTE', params: { route: 'mobileCompanion', path: '/mobile' } };
  }

  return { action: 'NONE', params: null };
};

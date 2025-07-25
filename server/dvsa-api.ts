// Official DVSA MOT API Integration
// Documentation: https://documentation.history.mot.api.gov.uk/

interface DVSATokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
}

interface DVSAApiCredentials {
  clientId: string;
  clientSecret: string;
  tokenUrl: string; // Full token URL with tenant ID included
  apiKey: string;
}

interface DVSAMotTest {
  completedDate: string;
  testResult: 'PASSED' | 'FAILED';
  expiryDate?: string;
  odometerValue?: string;
  odometerUnit?: 'mi' | 'km';
  odometerResultType?: 'READ' | 'UNREADABLE' | 'NO_ODOMETER';
  motTestNumber: string;
  rfrAndComments?: Array<{
    text: string;
    type: 'FAIL' | 'ADVISORY' | 'MINOR' | 'MAJOR';
    dangerous?: boolean;
  }>;
}

interface DVSAVehicleResponse {
  registration: string;
  make: string;
  model: string;
  firstUsedDate: string;
  fuelType: string;
  primaryColour: string;
  vehicleId: string;
  registrationDate: string;
  manufactureDate: string;
  engineSize?: string;
  motTests: DVSAMotTest[];
}

// Configuration
const DVSA_API_BASE_URL = 'https://history.mot.api.gov.uk';
const OAUTH_TOKEN_URL = 'https://login.microsoftonline.com';

// Token cache to avoid repeated authentication requests
let cachedToken: { token: string; expires: number } | null = null;

// Get API credentials from environment variables
function getDVSACredentials(): DVSAApiCredentials {
  const credentials = {
    clientId: process.env.DVSA_CLIENT_ID || '',
    clientSecret: process.env.DVSA_CLIENT_SECRET || '',
    tokenUrl: process.env.DVSA_TOKEN_URL || '',
    apiKey: process.env.DVSA_API_KEY || ''
  };

  if (!credentials.clientId || !credentials.clientSecret || !credentials.tokenUrl || !credentials.apiKey) {
    throw new Error('DVSA API credentials not configured. Please provide DVSA_CLIENT_ID, DVSA_CLIENT_SECRET, DVSA_TOKEN_URL, and DVSA_API_KEY environment variables.');
  }

  return credentials;
}

// Get OAuth2 access token from Microsoft Entra ID
async function getAccessToken(credentials: DVSAApiCredentials): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  // Use the full token URL provided by DVSA (includes tenant ID)
  const tokenUrl = credentials.tokenUrl;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      scope: 'https://tapi.dvsa.gov.uk/.default'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DVSA Auth Error:', response.status, errorText);
    throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
  }

  const tokenData: DVSATokenResponse = await response.json();
  
  // Cache the token (expires in ~1 hour, cache for 50 minutes to be safe)
  cachedToken = {
    token: tokenData.access_token,
    expires: Date.now() + (tokenData.expires_in - 600) * 1000
  };

  return tokenData.access_token;
}

// Main function to fetch MOT data from DVSA API
export async function fetchDVSAMotData(registration: string): Promise<DVSAVehicleResponse> {
  try {
    const credentials = getDVSACredentials();
    const accessToken = await getAccessToken(credentials);

    // Make API request to get vehicle MOT data
    const apiUrl = `${DVSA_API_BASE_URL}/v1/trade/vehicles/registration/${encodeURIComponent(registration)}`;
    
    console.log(`Fetching MOT data from DVSA API for registration: ${registration}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-API-Key': credentials.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DVSA API Error:', response.status, errorText);
      
      if (response.status === 404) {
        throw new Error(`Vehicle not found: ${registration.toUpperCase()}`);
      } else if (response.status === 401) {
        throw new Error('API authentication failed. Please check your credentials.');
      } else if (response.status === 403) {
        throw new Error('API access denied. Please check your API key and permissions.');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    const apiData = await response.json();
    
    // Validate response
    if (!apiData || (Array.isArray(apiData) && apiData.length === 0)) {
      throw new Error(`No data found for vehicle: ${registration.toUpperCase()}`);
    }

    // API returns array, take first result
    const vehicle = Array.isArray(apiData) ? apiData[0] : apiData;
    
    // Validate required fields
    if (!vehicle.registration || !vehicle.make || !vehicle.model) {
      throw new Error('Invalid vehicle data received from DVSA API');
    }

    console.log(`Successfully fetched MOT data for ${vehicle.registration} (${vehicle.make} ${vehicle.model})`);
    
    return vehicle;

  } catch (error) {
    console.error('DVSA API Integration Error:', error);
    throw error;
  }
}

// Helper function to validate UK registration format
export function validateUKRegistration(registration: string): boolean {
  const cleanReg = registration.replace(/\s/g, '').toUpperCase();
  
  // UK registration patterns
  const patterns = [
    /^[A-Z]{2}\d{2}[A-Z]{3}$/, // Current format (AB12 CDE)
    /^[A-Z]\d{1,3}[A-Z]{3}$/, // Prefix format (A123 BCD)
    /^[A-Z]{3}\d{1,3}[A-Z]$/, // Suffix format (ABC 123D)
    /^[A-Z]{1,3}\d{1,4}$/, // Dateless format (AB 1234)
  ];
  
  return patterns.some(pattern => pattern.test(cleanReg)) && cleanReg.length >= 2 && cleanReg.length <= 8;
}

// Check if DVSA API credentials are configured
export function isDVSAConfigured(): boolean {
  return !!(
    process.env.DVSA_CLIENT_ID &&
    process.env.DVSA_CLIENT_SECRET &&
    process.env.DVSA_TOKEN_URL &&
    process.env.DVSA_API_KEY
  );
}
import jwt from "jsonwebtoken";
import axios from "axios";
import "dotenv/config";

const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DOCUSIGN_CLIENT_ID = process.env.DOCUSIGN_CLIENT_ID;
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID;

// Process the private key to handle newlines and quotes correctly
const DOCUSIGN_PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY
    ? process.env.DOCUSIGN_PRIVATE_KEY
        .replace(/\\n/g, '\n')  // Convert escaped newlines to actual newlines
        .replace(/\\r/g, '')    // Remove any carriage return characters
        .replace(/^"|"$/g, '')  // Remove surrounding quotes
        .trim()
    : '';

async function getAccessToken() {
  try {
    if (!DOCUSIGN_PRIVATE_KEY) {
      throw new Error("DocuSign private key is not configured");
    }

    console.log("Using private key:", DOCUSIGN_PRIVATE_KEY.substring(0, 50) + "..."); // Log first 50 chars for debugging

    const jwtToken = jwt.sign(
      {
        iss: DOCUSIGN_CLIENT_ID,
        sub: DOCUSIGN_USER_ID,
        aud: "account-d.docusign.com",
        scope: "signature impersonation",
      },
      DOCUSIGN_PRIVATE_KEY,
      { 
        algorithm: "RS256", 
        expiresIn: "1h" 
      }
    );

    const response = await axios({
      method: 'post',
      url: 'https://account-d.docusign.com/oauth/token',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
    });

    console.log("Access Token Response:", response.data);
    return response.data.access_token;
  } catch (error) {
    console.error("Error in getAccessToken:", error.response?.data || error.message);
    throw error;
  }
}

async function handleDocuSignAction(action, body, accessToken, res) {
  const baseUrl = `https://demo.docusign.net/restapi/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  try {
    switch (action) {
      case "createTemplate":
        console.log("Creating template with body:", body);
        const templateResponse = await axios({
          method: 'post',
          url: `${baseUrl}/templates`,
          headers,
          data: body.templateJson,
        });
        console.log("Template creation response:", templateResponse.data);
        return templateResponse.data;

      case "createEnvelope":
        console.log("Creating envelope with body:", body);
        const envelopeResponse = await axios({
          method: 'post',
          url: `${baseUrl}/envelopes`,
          headers,
          data: body,
        });
        console.log("Envelope creation response:", envelopeResponse.data);
        return envelopeResponse.data;

      case "getSigningUrl":
        const { envelopeId, signerId,name,email,returnUrl } = body;
        const signingUrlResponse = await axios({
          method: 'post',
          url: `${baseUrl}/envelopes/${envelopeId}/views/recipient`,
          headers,
          data: {
            authenticationMethod: "email",
            clientUserId: signerId,
            userName: name,
            email: email,
            returnUrl: returnUrl,
          },
        });
        return { signingUrl: signingUrlResponse.data.url };

      case "getTemplatePDF":
        const { templateId } = body;
        if (!templateId) {
          throw new Error("Missing templateId");
        }

        // Step 1: Fetch document details
        const documentDetailsResponse = await axios({
          method: 'get',
          url: `${baseUrl}/templates/${templateId}/documents`,
          headers,
        });

        if (!documentDetailsResponse.data?.templateDocuments) {
          throw new Error("No documents found for the template");
        }

        const documentId = documentDetailsResponse.data.templateDocuments[0]?.documentId;
        if (!documentId) {
          throw new Error("No document ID found for the template");
        }
        console.log("Document ID:", documentId);
        // Step 2: Fetch the PDF
        const pdfResponse = await axios({
          method: 'get',
          url: `${baseUrl}/templates/${templateId}/documents/${documentId}`,
          headers,
          responseType: 'stream',
        });
        console.log("PDF Response:", pdfResponse.data);
        // Pipe the PDF response directly back to the frontend
        res.setHeader("Content-Type", "application/pdf");
        pdfResponse.data.pipe(res);
        break;

      case "getEnvelopeAndSignerStatus": {
        const { envelopeId, signerId } = body;
        
        const envelopeStatusResponse = await axios({
          method: 'get',
          url: `${baseUrl}/envelopes/${envelopeId}`,
          headers,
        });

        const signerStatusResponse = await axios({
          method: 'get',
          url: `${baseUrl}/envelopes/${envelopeId}/recipients`,
          headers,
        });

        console.log("Signer status response:", signerStatusResponse.data);
        const signer = signerStatusResponse.data.signers.find(
          (s) => s.clientUserId === signerId
        );

        return {
          envelopeStatus: envelopeStatusResponse.data.status,
          signerStatus: signer?.status || "unknown",
        };
      }

      case "getEnvelopeStatus": {
        const { envelopeId } = body;
        const statusResponse = await axios({
          method: 'get',
          url: `${baseUrl}/envelopes/${envelopeId}`,
          headers,
        });
        return statusResponse.data;
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    console.error(`Error in ${action}:`, error.response?.data || error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins (for testing only)
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, ...body } = req.body;

  if (!action) {
    return res.status(400).json({ error: "Action is required" });
  }

  try {
    const accessToken = await getAccessToken();
    const result = await handleDocuSignAction(action, body, accessToken, res);
    if (result) {  // Only send response if result exists (not for PDF streaming)
      res.status(200).json(result);
    }
  } catch (error) {
    console.error("DocuSign API Error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data
    });
  }
}

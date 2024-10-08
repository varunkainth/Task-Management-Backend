import jwt from 'jsonwebtoken';

const JWTGen = async ({ Time, Role, Id }) => {
  try {
    const token = jwt.sign({ Role, Id }, process.env.JWT_SECRET_KEY, {
      expiresIn: Time,
    });
    console.log(token)
    return token;
  } catch (error) {
    console.log("Token Gen Error: ", error);
    return error.message;
  }
};

export default JWTGen;

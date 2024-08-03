import jwt from "jsonwebtoken";

const JWTGen = async ({ Time, Role, Id }) => {
  try {
    const token = jwt.sign({ Time, Role, Id }, process.env.SECRET_KEY, {
      expiresIn: Time,
    });
    return token;
  } catch (error) {
    conosle.log("Token Gen Error: ", error);
    return error.message;
  }
};

export default JWTGen

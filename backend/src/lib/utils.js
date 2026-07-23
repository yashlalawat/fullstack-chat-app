import jwt from "jsonwebtoken";

export const generateToken = (userId , res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET , {
        expiresIn: "7d",
    });

    res.cookie("jwt", token , {
        maxAge: 7 * 24 * 60 * 60 * 1000, //MS
        httpOnly: true, //prevent XSS attacks cross-site scripting attacks
        sameSite: "strict", //CSRF attacks corss-site request forgery attacks
        secure: process.env.NODE_ENV != "development", //it gives false
    });

    return token;
};
//httpOnly: true, jwt is not accesible by js
//secure : true-https , false-http
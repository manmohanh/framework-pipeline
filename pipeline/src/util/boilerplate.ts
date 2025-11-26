const getServiceInPascalCase = (service: string) => {
  const arr = service.split("-");
  const tmp = arr.map((item) => {
    const firstLetter = item[0].toUpperCase();
    const restLetter = item.slice(1);
    return firstLetter + restLetter;
  });
  return tmp.join("");
};

export const appBoilerplate = (service: string, port: number) => {
  const Provider = getServiceInPascalCase(service);
  return [
    `import dotenv from "dotenv"`,
    `dotenv.config()\n`,
    `import mongoose from "mongoose"`,
    `mongoose.connect(process.env.DB!)`,
    `.then(()=>console.log("${service} - Database is running"))`,
    `.catch(()=>console.log("${service} - Failed to connect with database"))\n`,
    `import express, { Request, Response } from "express"`,
    ` import ${Provider}Router from "./${service}.router"`,
    `import morgan from "morgan"`,
    `import cors from "cors"`,
    `const app = express()`,
    `app.listen(process.env.PORT, ()=>console.log("${service} service is running on - http://localhost:${port}/${service}"))\n`,
    `app.use(cors({`,
    `\torigin: process.env.CLIENT,`,
    `\tcredentials: true`,
    `}))`,
    `app.use(express.json())`,
    `app.use(express.urlencoded({extended: false}))`,
    `app.use(morgan('dev'))\n`,
    `app.use("/${service}",${Provider}Router)`,
  ].join("\n");
};

export const routerBoilerplate = (service: string) => {
  const Provider = getServiceInPascalCase(service);
  return [
    `import {Router,Request,Response} from "express"`,
    `const ${Provider}Router = Router()\n`,
    `${Provider}Router.get("/",(req:Request,res:Response)=>{`,
    `\tres.json({message:"Hello from ${service} service"})`,
    `})\n`,
    `export default ${Provider}Router;`,
  ].join("\n");
};

export const interfaceBoilerplate = (service: string) => {
  const Provider = getServiceInPascalCase(service);
  return [
    `import { Document } from "mongoose";\n`,
    `export interface ${Provider}ModelInterface extends Document {\n`,
    `}`,
  ].join("\n");
};

export const modelBoilerplate = (service: string) => {
  const Provider = getServiceInPascalCase(service);
  return [
    `import {Schema,model} from "mongoose"`,
    `import { ${Provider}ModelInterface } from "./${service}.interface"\n`,
    `const schema = new Schema<${Provider}ModelInterface>({\n`,
    `\t`,
    `},{timestamps:true})\n`,
    `const ${Provider}Model = model<${Provider}ModelInterface>("${Provider}",schema)`,
    `export default ${Provider}Model`,
  ].join("\n");
};

export const packageBoilerplate = (service: string) => {
  const data = {
    name: service,
    version: "1.0.0",
    description: "",
    main: "index.js",
    scripts: {
      build: "tsc",
      dev: "ts-node-dev --respawn --transpile-only src/app.ts",
      start: "node dist/app.js",
    },
    keywords: [],
    author: "",
    license: "ISC",
    dependencies: {
      cors: "^2.8.5",
      dotenv: "^17.2.3",
      express: "^5.1.0",
      mongoose: "^9.0.0",
      morgan: "^1.10.1",
    },
    devDependencies: {
      "@types/cors": "^2.8.19",
      "@types/express": "^5.0.5",
      "@types/morgan": "^1.9.10",
      "@types/node": "^24.10.1",
      "ts-node-dev": "^2.0.0",
      typescript: "^5.9.3",
    },
  }
  return JSON.stringify(data,null,2);
};

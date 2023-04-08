import { exec } from "child_process";

export const execPromise = (command: string) => {
  const promise = new Promise(resolve => {
    exec(command, (error, stdout, stderr) => {
      if(error) console.log(error);
      if(stdout) console.log(stdout);
      // if(stderr) console.log(stderr);
      resolve(null);
    })
  });
  return promise;
};
const authenticate = (token: any) => {
  if (token.startsWith('valid')) return true;
  else if (token === "") return false;
  else return false;
}

export default authenticate
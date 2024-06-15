type GitHubUser = {
  login: string;
  email: string;
};

export async function getGitHubUser(accessToken: string) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const { message } = await res.json();
    throw new Deno.errors.BadResource(message);
  }

  const user = (await res.json()) as GitHubUser;
  return user;
}

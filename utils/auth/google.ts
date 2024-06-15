type GoogleUser = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
};

export async function getGoogleUser(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const { message } = await res.json();
    throw new Deno.errors.BadResource(message);
  }

  const user = (await res.json()) as GoogleUser;
  return user;
}

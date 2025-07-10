import { define } from "@/utils/state.ts";

export default define.page(() => {
  return (
    <div class="flex flex-col items-center">
      <img
        class="my-6"
        src="/logo.png"
        width="200"
        height="200"
      />
      <h1 class="text-4xl font-bold">Welcome to Expenso</h1>
      <h2>Sign in on the top-right button!</h2>
    </div>
  );
});

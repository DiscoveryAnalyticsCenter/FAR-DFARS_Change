const headers = {
  "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
  "Content-Type": "application/json"
}

const model = "gpt-4o-mini";
const temperature = .7;

export async function summarize(comments: string[]) {
  const commentString = comments.join("&&&");
  let body = {
    "model": model,
    "messages": [
      {
        "role": "system",
        "content": `You are a service which will aggregate a list of comments regarding a government FARS proposal, with each separate proposal separated by a "&&&", into one brief summary (two short sentences, max). You will not be given instructions each request, just summarize. Do not refer to the comments, just mention their content`
      },
      {
        "role": "user",
        "content": commentString
      }
    ],
    "temperature": temperature
  };
  let res: any = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
  });

  let output = await res.json();
  const summary = output.choices[0].message;

  let body2 = {
    "model": model,
    "messages": [
      {
        "role": "user",
        "content": `Generate a short title (no more than five words) for the following comment list, with each separate comment separated by a '&&&' which represents the overall, general content of the comments. The title should be as detailed as possible about the comment content. Specifically mention key words from within the comments. The comment list follows: ${commentString}`
      }

    ],
    "temperature": temperature
  };

  let res2: any = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body2)
  });
  let output2 = await res2.json();
  const title = output2.choices[0].message;

  return {
    summary: summary.content,
    title: title.content
  }
}

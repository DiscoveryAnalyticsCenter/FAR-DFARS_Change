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
    title: title.content.replace(/"/g, '')
  }
}

export async function summarizeOverall(summaries: string[]) {
  const summaryString = summaries.join("&&&");
  let body = {
    "model": model,
    "messages": [
      {
        "role": "system",
        "content": `You are a service which will aggregate a list of comment summaries regarding a government FARS proposal, with each separate summary separated by a "&&&", into one brief summary (two short sentences, max). You will not be given instructions each request, just summarize. Do not refer to the summaries, just mention their content`
      },
      {
        "role": "user",
        "content": summaryString
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
  const summary = output.choices[0].message.content;

  return summary
}

export async function generateRevision(summary: string) {
  let body = {
    "model": model,
    "messages": [
      {
        "role": "system",
        "content": `You will be given a comment that was made on a proposed rule for the Federal Aquisition Regulation rules. 
        The comment details a problem that a reader had with the proposal. Please suggest a brief (no more than 5 short sentences) revision which could resolve the problem outlined by the comment. 
        Format your response as specific revisions which could be made to current Federal Aquisition Rules, referring to the document where appropiate. Your response should NOT be in first-person,
        but rather should only discuss the specific changes needed to be made. If the comment seems to refer to an external document, return ONLY an empty string.`
      },
      {
        "role": "user",
        "content": summary
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

  return output.choices[0].message.content;
}

export async function generateProposal(NDAASection: string, year: string, FARSection: string) {
  let body = {
    "model": model,
    "messages": [
      {
        "role": "user",
        "content": `Take the text from the National Defense Authorization Act for Fiscal Year ${year} section ${NDAASection} and revise the Defense Federal Acquisition Regulation Supplement section ${FARSection}.
          Maintain the same DFARS clause number and add or update sub clause numbers as necessary
          Maintain the same DFARS clause title
          Clarify under which conditions the clause applies, including specific contract types, dollar thresholds, or contractor classifications.
          Maintain and amend the requirements from the current DFARS clause. Include contractor responsibilities, compliance measures, reporting requirements, and procedures.
          Maintain references to other relevant FAR, DFARS, or government regulations and add any new references needed as a result of the NDAA text.
          If and only if there are any flow-down provisions that specify when the clause must be included in subcontracts and, if so, under what conditions include or add them. Format your response in HTML. Please ONLY include the contents of the proposed rule and NOTHING more in your response.`
      },
    ],
    "temperature": temperature
  };
  let res: any = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
  });

  let output = await res.json();
  const proposal = output.choices[0].message.content;

  body = {
    "model": model,
    "messages": [
      {
        "role": "user",
        "content": `Take the text from the National Defense Authorization Act for Fiscal Year ${year} section ${NDAASection} and revise the Defense Federal Acquisition Regulation Supplement section ${FARSection}.
          Maintain the same DFARS clause number and add or update sub clause numbers as necessary
          Maintain the same DFARS clause title
          Clarify under which conditions the clause applies, including specific contract types, dollar thresholds, or contractor classifications.
          Maintain and amend the requirements from the current DFARS clause. Include contractor responsibilities, compliance measures, reporting requirements, and procedures.
          Maintain references to other relevant FAR, DFARS, or government regulations and add any new references needed as a result of the NDAA text.
          If and only if there are any flow-down provisions that specify when the clause must be included in subcontracts and, if so, under what conditions include or add them. 
          Format your response in HTML. Please ONLY include the contents of the proposed rule and NOTHING more in your response.`
      },
      {
        "role": "assistant",
        "content": `${proposal}`
      },
      {
        "role": "user",
        "content": `Please provide a summary of the change, background of the change, 
          discussion and analysis of the change and expected impacts of the change to be published in the Federal Register. 
          Please ONLY include the contents of the proposed rule and NOTHING more in your response.`
      }
    ],
    "temperature": temperature
  };
  res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
  });
  output = await res.json();
  const frs = output.choices[0].message.content;

  return {
    proposal,
    frs
  };
}

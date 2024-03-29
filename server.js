const express = require('express');
const cors = require('cors');
const app = express();
const { auth, requiresAuth } = require('express-openid-connect');
const port =  process.env.PORT || 3000;
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * App Configuration
*/
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(cors());
app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_CLIENT_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_DOMAIN
    }));
app.use(async function (req, res, next) {
        res.locals.user = req.oidc.user;
        next();
    });
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.get('/', (req, res) => {
    res.render(path.join(__dirname + '/public/views/index.ejs'));
})
app.get('/countdown', (req, res) => {
    res.render(path.join(__dirname + '/public/views/countdown.ejs'));
});
async function setDB(req){
    // set database with profile in users column, with the "profile_obj" data
    const currentDate = new Date();
    var profile_obj = {
        user:req.oidc.user,
        premium: 0,
        premiumExpiry: null,
        gen_refresh:new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate() + 1,0,0,0).getTime(),
        free_gens:10
    }
    // check if db exists
    const { data, error } = await supabase
        .from('users')
        .insert([{"profile": profile_obj, "uid": req.oidc.user.sub}]).select();
    if(error) console.log(error);
    return data[0];
 }
async function updateDB(req,body,profile_obj){
    const { data, error } = await supabase
        .from('users')
        .update([{"profile": profile_obj}])
        .eq('uid', req.oidc.user.sub)
        .eq('id', body.id)
        .select();
    if(error) return console.log(error);
    return data[0];
}
 async function checkProfile(req){
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', req.oidc.user.sub);
    if(error) console.log(error);
    if(data && data.length > 0) {
        const reset_time = await data[0].profile.gen_refresh ? data[0].profile.gen_refresh : 0;
        if(Date.now() > reset_time) {
            const currentDate = new Date();
           const new_data = await updateDB(req, data[0], {
                user:req.oidc.user,
                premium: 0,
                premiumExpiry: null,
                gen_refresh:new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate() + 1,0,0,0).getTime(),
                free_gens:10
            });
            return new_data;
        }
        
        return data[0];
    }
    else {
        const new_data = await setDB(req);
        return new_data;
    }

}
app.get('/subscribe', requiresAuth(), async (req, res) => {
    const profile = await checkProfile(req);
    res.render(path.join(__dirname + '/public/views/subscribe.ejs'), {
        profile: profile
    });
})
app.get('/gen', requiresAuth(), async (req, res) => {
    let profile = checkProfile(req);
    res.render(path.join(__dirname + '/public/views/gen.ejs'), {
        profile: profile,
        premium: profile ? profile.premium !== 0 : 0,
    });


});
  // Defined routes
app.post(`/generate-question`, async (req, res) => {
    const prompt = req.body.prompt;
    const value = req.body.value
    if (prompt) {
        const question = await generateQuestion(req, res, value, prompt);
        res.send({ question });
    } else {
        res.status(400).send({ error: 'Prompt not provided.' });
    }
});

async function generateQuestion(req, res, value, prompt) {
    async function fetchQuestion(text) {
        try {
       const response= await fetch(process.env.url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OR_API_KEY}`,
              "HTTP-Referer": "https://qgenie.co.uk",
              "X-Title": "QGenie (Sources)",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "model": "google/gemini-pro", // Optional (user controls the default),
              "messages": [
                {"role": "user", "content": text },
              ]
            })
          });
          if(!response.ok) {
            res.status(response.status || 400).send({ error: response.statusText });
          }
          const result = await response.json();
          return result.choices[0].message.content;
        }
        catch(error) {
            console.log(error);
            return "An unexpected error occurred. Please try again later.";
        }
    }
        const source_txt = `You are a language model that provides sources or context for a specific subject. The subject is ${getMessage(value, prompt)[0]}, and the specific topic within that is ${prompt}. Provide an extract or source which can be used as context to create answer exam style questions Do not provide an answer to this question, or the questions themselves. Provide exclusively one real life, detailed source or piece of context with statistics still in relation to the topic that can be used to answer a variety of questions in relation to the topic, preferrably around 1-2 paragraphs in length.`;
        const source = await fetchQuestion(source_txt);
        const question_txt = `

        Now, provide unique exam style questions in relation to ${prompt}, as well as the source you just provided.  Put the question number then mention the question explicitly, as well as the marks, and then in the next line "Ans: " and Answer.
        Output format:
       <Question Number>. <Question> [<Marks>]

        Do not provide an answer to each question. Provide exclusively the questions, and the marks.

        For this prompt specifically:
        ${getMessage(value, prompt)[1]}
        `;

        try {
        const response= await fetch(process.env.url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OR_API_KEY}`,
              "HTTP-Referer": "https://qgenie.co.uk",
              "X-Title": "QGenie (Qs)",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "model": "google/gemini-pro", // Optional (user controls the default),
              "messages": [
                {role: "user", content: source_txt},
                {role: "assistant", content: source },
                {role: "user", content: question_txt },
              ]
            })
          });
          if(!response.ok) {
            res.status(response.status || 400).send({ error: response.statusText });
          }
          const result = await response.json();
          // reduce free_gens in supabase database by one, and if free gens is now zero, return "No more free gens"
          let profile = await checkProfile(req);
          if(profile.profile.free_gens > 0) {
            profile.profile.free_gens -= 1;
            await updateDB(req, profile, profile.profile);
          }
          else {
              return "You have run out of Free Generations! Please purchase QGenie Pro or Premium for Unlimited Generations!";
          }
          const body = result.choices[0].message.content;
          console.log(source, body)
          const cleaned_body = body.replace("/\bNote:.*$|\bAns:.*$/gm", "").replace("/(\d+)\. (.*?) \[(\d+)\]/g", "$1. $2 [$3]");
          return cleaned_body;
        }
        catch(error) {
            console.log(error);
            return "An unexpected error occurred. Please try again later.";
        }
}


function getMessage(msg, prompt) {
    switch(msg){
        case '1':
            return [`
            Edexcel A Level Economics A: Paper 1: "Introduction to markets and market failure`,
            `Write a 4, 5, 10, 15 and 25 mark essay question in accordance with the Edexcel A Level Economics A: "Introduction to markets and market failure" specification. The essay question should be in style of the following prompt: ${prompt}. Here is an example of a sample output:
            1. Explain how information asymmetry can lead to adverse selection in the market for used cars. [4 marks]
            2. Explain the likely effect of the change in subsidy levels between 2017 and 2018 on rail fares. [5 marks]
            3. Assess how the regulation of energy suppliers’ profits is likely to affect consumers and suppliers in the energy market. [10 marks]
            4. Discuss policies businesses and government might implement to reduce labour immobility to benefit the energy sector. [15 marks]
            5. With reference to an industry of your choice, evaluate why some firms engage in collusive behaviour [25 marks]
            `];
        case '2':
            return ["Edexcel A Level Economics A: Paper 2: The UK Economy: Performace and Policies",`Write a 4, 5, 10, 15 and 25 mark essay question in accordance with the Edexcel A Level Economics A: "The UK Economy: Performace and Policies" specification. The essay question should also be in relation to: ${prompt}.
            Here is a sample output:
            1. Explain two limitations of using the HDI to compare levels of development between countries and over time. [4 marks]
            2. Explain the distinction between absolute poverty and relative poverty. [5 marks]
            3. Examine two factors that might explain the differing rates of decline in absolute poverty in East Asia and Sub-Saharan Africa. [10 marks]
            4. Discuss the role of the financial sector in the growth and development of developing countries. [15 marks]
            5. Evaluate the likely economic effects of a planned increase in government expenditure. [25 marks]
            `];
        case '3':
            return ["AQA A Level History: Tsarist and Communist Russia",`Write 5 25 mark essay questions in accordance with the AQA A Level History: Tsarist and Communist Russia specification. The essay questions should also be in relation to: ${prompt}. The essay questions should provide a statement, followed by one of the statements: "To what extent do you agree", "Assess the validity of this view", or "Explain why you disagree or agree with this view". The statement should also provide a time range, which would best fit the question.`];
        case '4':
            return ["AQA A Level History: The English Revolution",`Write 5 25 mark essay questions in accordance with the AQA A Level History: The English Revolution specification. The essay questions should also be in relation to: ${prompt}. The essay questions should provide a statement, followed by one of the response "To what extent do you agree", "Assess the validity of this view", or "Explain why you disagree or agree with this view". The statement should also provide a time range, which would best fit the question.`];
        case '5':
            return ["Edexcel A Level Mathematics: Statistics", `Write 5 exam style questions in accordance with the Edexcel A Level Mathematics: Statistics Specification. Write any equations involved in any questions in LaTeX, inline format. The questions should be related to ${prompt}.`];
        case '6':
            return ["Edexcel A Level Mathematics: Pure Mathematics",`Write 5 exam style questions in accordance with the Edexcel A Level Mathematics: Pure Mathematics Specification. Write any equations involved in any questions in LaTeX, inline format. The questions should be related to ${prompt}`];
        case '7':
            return ["Edexcel A Level Mathematics: Mechanics",`Write 5 exam style questions in accordance with the Edexcel A Level Mathematics: Mechanics Specification. Write any equations involved in any questions in LaTeX, inline format. The questions should be related to ${prompt}`];
        case '8':
            return ["Edexcel A Level Further Mathematics: Core Pure",`Write 5 exam style questions in accordance with the Edexcel A Level Further Mathematics: Core Pure Specification. Write any equations involved in any questions in LaTeX, inline format. The questions should be related to ${prompt}`];
        case '9':
            return ["Edexcel A Level Further Mathematics: Further Statistics", `Write 5 exam style questions in accordance with the Edexcel A Level Further Mathematics: Further Statistics Specification. Write any equations involved in any questions in LaTeX, inline format. The questions should be related to ${prompt}`];
        case '10':
            return ["Edexcel A Level Further Mathmatics: Further Mechanics", `Write 5 exam style questions in accordance with the Edexcel A Level Further Mathematics: Further Mechanics Specification. Write any equations involved in any questions in LaTeX, inline format. The questions should be related to ${prompt}`];
        case '11':
            return ["AQA A Level Geography: Physical Geography",`Write a 3, 4, 6, 9 and 20 mark essay question in accordance with the AQA A Level Geography: Physical Geography Specification. The essay questions should be in relation to the following prompt: ${prompt}.`];
        case '12':
            return ["AQA A Level Geography: Human Geography",`Write a 3, 4, 6, 9 and 20 mark essay question in accordance with the AQA A Level Geography: Human Geography Specification. The essay questions should be in relation to the following prompt: ${prompt}.`];
        case '13':
            return ["Edexcel A Level Government and Politics: UK Government",`Write 5 30 mark essay questions in accordance with the Edexcel A Level Government and Politics: UK Government Specification. The essay questions should be in relation to the following prompt: ${prompt}.`];
        case '14':
            return ["Edexcel A Level Government and Politics: UK Politics",`Write 5 30 mark essay questions in accordance with the Edexcel A Level Government and Politics: UK Politics Specification. The essay questions should be in relation to the following prompt: ${prompt}.`];
        case '15':
            return ["OCR A Level Media: Evolving Media",`Write 2 10, 2 15 and 1 30 mark essay question in accordance with the OCR A Level Media: Evolving Media specification. The essay questions should be in relation to the following prompt: ${prompt}.`];
        case '16':
            return ["Edexcel A Level Biology",`Write a 1, 2, 3, 4 and 6 mark exam style question in accordance with the AQA A Level Biology Specification. The questions should be in relation to the following prompt: ${prompt}.`];
        case '17':
            return ["Edexcel A Level Chemistry: Advanced Inorganic and Physical Chemistry",`Write a 1, 2, 3, 4 and 6 mark exam style question in accordance with the Edexcel A Level Chemistry: Advanced Inorganic and Physical Chemistry Specification. Write any equations involved in any questions in LaTeX format. The questions should be in relation to the following prompt: ${prompt}.`];
        case '18':
            return ["Edexcel A Level Chemistry: Advanced Organic and Physical Chemistry",`Write a 1, 2, 3, 4 and 6 mark exam style question in accordance with the Edexcel A Level Chemistry: Advanced Organic and Physical Chemistry Specification. Write any equations involved in any questions in LaTeX format. The questions should be in relation to the following prompt: ${prompt}.`];
        case '19':
            return ["AQA A Level Physics",`Write a 1, 2, 3, 4 and 5 mark exam style question in accordance with the AQA A Level Physics Specification. The questions should be in relation to the following prompt: ${prompt}.`];
    }
}

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
});
module.exports = app;
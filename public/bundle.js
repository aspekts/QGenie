(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const form = document.getElementById('question-form');
const generateBtn = document.getElementById('generate-btn');
const questionContainer = document.getElementById('question-container');
const para = document.createElement('p');
const promptSelect = document.getElementById('prompt');
const subPromptSelect = document.getElementById('sub-prompt');
const nestedSelect = document.getElementById('nested-select');
const prompts = require("./subjects.json");
promptSelect.addEventListener('change', (e) => {
    const value = e.target.value;

    if (value !== 'none') {
        subPromptSelect.innerHTML = '';
        prompts[value].forEach((optionText) => {
            const option = document.createElement('option');
            option.value = value;
            option.innerText = optionText;
            subPromptSelect.appendChild(option);
        });
        nestedSelect.classList.remove('hidden');
    } else {
        nestedSelect.classList.add('hidden');
    }
});
if (!questionContainer.innerText) {
    questionContainer.innerText = 'No question generated yet. Try to generate one!';
}

generateBtn.addEventListener('click', async () => {
    // get value of nested  subprompt select
    const prompt = form.elements['sub-prompt'].options[form.elements['sub-prompt'].selectedIndex].text;
    const val = form.elements.prompt.options[form.elements.prompt.selectedIndex].value;
    if (prompt && val !== 'none') {
        // Show the loader
        questionContainer.innerHTML = `
            <img src="./assets/new/logo.gif" alt="QGenie Logo Anim" class="h-16 w-28"></img>
        `;
        const response = await fetch('/generate-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value: val, prompt: prompt })
        })
        if(!response.ok){
            console.log(response);
            alert("Something went wrong. Please try again.");
            return;
        }
        const data = await response.json();
            console.log(data);
            const question = data.question;
            questionContainer.innerHTML = '';
            para.innerText = question;
            questionContainer.appendChild(para);
            renderMathInElement(questionContainer, {
                // customised options
                // • auto-render specific keys, e.g.:
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                // • rendering keys, e.g.:
                throwOnError : false
              });
    } else {
        alert('Please select a prompt!');
        return;
    }
});
},{"./subjects.json":2}],2:[function(require,module,exports){
module.exports={
    "1": [
        "The Economic Problem",
        "Allocation of Resources",
        "Demand",
        "Supply",
        "Elasticity",
        "Market Equilibrium",
        "Indirect Taxes and Subsidies",
        "Price Controls: Minimum and Maximum Prices",
        "Market Failure and Externalities",
        "Public Goods and Quasi-Public Goods",
        "Common access resources",
        "Information asymmetry and market failure"
    ],
    "2": [
        "Measures of Economic Performance",
        "Aggregate Demand",
        "Aggregate Supply",
        "National Income and Economic Welfare",
        "Economic Growth",
        "Inflation",
        "Unemployment",
        "Balance of Payments",
        "Macroeconomic Objectives and Policy",
        "Conflicts and Trade Offs"
    ],
    "3": [
        "Political, Social and Economic Condition of Russia in 1855",
        "The Impact of the Crimean War",
        "The Emancipation of the Serfs",
        "Alexander II and III as rulers",
        "Russification & Treatment of Ethnic Minorities",
        "Opposition: Liberals, Radicals and the Tsarist Reaction",
        "Industrial Developments and the Land Issue",
        "Nicholas II as ruler",
        "The 1905 Revolution",
        "The Dumas",
        "Economic and Social Developments up to 1914",
        "Marxism, Socialism and Liberalism",
        "Political, Economic and Social Problems of Wartime",
        "The Collapse of Autocracy",
        "The Provisional Government",
        "The Bolsheviks and the October Revolution"
    ],
    "4": [
        "The Legacy of James I",
        "Monarchy and Divine Right",
        "Challenges to the arbitrary government of Charles I",
        "Parlimentary Radicalism",
        "Charles I\"s Personal Rule",
        "Religious Issues",
        "Political Issues",
        "Radicalism, dissent and the approach of war",
        "The Political Nation, 1640",
        "John Pym and the spread of parliamentary radicalism",
        "Conflicts between the Crown and Parliament",
        "The \"slide\" into war"
    ],
    "5": [
        "Data Collection",
        "Measures of Location and Spread",
        "Representations of Data",
        "Correlation",
        "Statistical (Binomial) Distribution",
        "Hypothesis Testing",
        "Conditional Probability",
        "The Normal Distribution"
    ],
    "6": [
        "Proofs",
        "Algebra and Functions",
        "Coordinate Geometry",
        "Trigonometry",
        "Exponentials and Logarithms",
        "Differentiation",
        "Integration",
        "Vectors"
    ],
    "7": [
        "Modelling in Mechanics",
        "Constant Acceleration",
        "Forces and Motion",
        "Variable Acceleration",
        "Hypothesis Testing",
        "Kinematics",
        "Forces and Motion",
        "Moments"
    ],
    "8": [
        "Complex Numbers",
        "Argand Diagrams",
        "Series",
        "Roots of Polynomials",
        "Volumes of Revolution",
        "Matrices",
        "Linear Transformations",
        "Proof by Induction",
        "Vectors",
        "Polar Coordinates",
        "Modelling wih Differential Equations"
    ],
    "9": [
        "Discrete Random Variables",
        "Poisson Distributions",
        "Geometric and NB Distributions",
        "Hypothesis Testing",
        "Central Limit Theorem",
        "Chi-Squared Tests",
        "Probability Generating Functions",
        "Quality of Tests",
        "Estimation, Confidence Intervals and Tests Using Normal Distribution",
        "Confidence Intervals and Tests Using t-Distribution"
    ],
    "10": [
        "Momentum and Impulse",
        "Work, Energy and Power",
        "Elastic Strings and Springs",
        "Elastic Collisions in 1D",
        "Elastic Collisions in 2D",
        "Circular Motion",
        "Centres of Mass of Plane Figures",
        "Further Centres of Mass",
        "Kinematics",
        "Dynamics"
    ],
    "11": [
        "Water and Carbon Cycles",
        "Hot Desert Systems and Landscapes",
        "Coastal Systems and Landscapes",
        "Glacial Systems and Landscapes",
        "Hazards",
        "Ecosystems under Stress"
    ],
    "12": [
        "Global systems and global governance",
        "Changing places",
        "Contemporary urban environments",
        "Population and the environment",
        "Resource security"
    ],
    "13": [
        "The Constitution",
        "Parliament",
        "Prime Minister and the executive",
        "Relationship between the branches",
        "The judiciary and civil liberties",
        "Devolution"
    ],
    "14": [
        "Democracy and participation",
        "Political parties",
        "Electoral systems",
        "Voting behaviour and the media",
        "Pressure groups"
    ],
    "15": [
        "Media Language",
        "Representations",
        "Media Industries",
        "Audiences",
        "Media Contexts"
    ],
    "16": [
        "Biological Molecules",
        "Cells",
        "Organisms exchange substances with their environment",
        "Genetic information, variation and relationships between organisms",
        "Energy transfers in and between organisms",
        "Genetics, populations, evolution and ecosystems",
        "The control of gene expression"
    ],
    "17": [
        "Atomic Structure and the Periodic Table",
        "Bonding and Structure",
        "Redox I",
        "Redox II",
        "Inorganic Chemistry and the Periodic Table",
        "Energetics I",
        "Energetics II",
        "Equilibrium I",
        "Equilibrium II",
        "Acid-Base Equilibria",
        "Transition Metals"
    ],
    "18": [
        "Bonding and Structure",
        "Redox I",
        "Formulae, Equations and Amounts of Substance",
        "Kinetics I",
        "Kinetics II",
        "Organic Chemistry I",
        "Organic Chemistry II",
        "Organic Chemistry III"
    ],
    "19": [
        "Measurements and Their Errors",
        "Particles and Radiation",
        "Waves",
        "Mechanics and Materials",
        "Electricity",
        "Further Mechanics",
        "Thermal Physics",
        "Fields and Their Consequences",
        "Nuclear Physics"
    ]
}
},{}]},{},[1]);

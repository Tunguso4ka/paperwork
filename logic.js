var params = new URLSearchParams(document.location.search);

const user = "crazy1112345";
const repo = "RMC14Paperwork";
const branch = "main";

var dir;

var text;
var tree;

var file_name = "document.txt";

const elements = {
    "[bold]": "<strong>[bold]",
    "[italic]": "<em>[italic]",
    "[bolditalic]": "<strong><em>[bolditalic]",
    "[/bold]": "[/bold]</strong>",
    "[/italic]": "[/italic]</em>",
    "[/bolditalic]": "[/bolditalic]</em></strong>",
    "[head]": "<h3>[head]",
    "[head=1]": "<h3>[head=1]",
    "[head=2]": "<h3>[head=2]",
    "[head=3]": "<h3>[head=3]",
    "[/head]": "[/head]</h3>",
    "[/color]": "[/color]</span>",
}

document.addEventListener('DOMContentLoaded', function()
{
    text = document.getElementById("text");
    text.addEventListener("focusout", rerender_text)

    tree = document.getElementById("tree");

    fetch_directory(`https://api.github.com/repos/${user}/${repo}/git/trees/${branch}?recursive=1`);

    if (params.has('file'))
        fetch_file(`https://api.github.com/repos/${user}/${repo}/contents/${params.get('file')}`)

}, false);

async function fetch_directory(url)
{
    const response = await fetch(url);
    dir = await response.json();

    var tree_links = {"": tree}

    for (const i of dir.tree)
    {
        const path = [i.path.split('/').slice(0, -1).join('/'), i.path.split('/').slice(-1)[0]];

        const tree_item = document.createElement("li");

        const tree_item_span = document.createElement("span");
        tree_item_span.innerText = path[1];

        if (i.type == "tree")
        {
            tree_item_span.classList.add("caret");
            tree_item_span.addEventListener("click", function() {
                this.parentElement.querySelector(".nested").classList.toggle("active");
                this.classList.toggle("caret-down");
            });
        }
        else
        {
            tree_item_span.addEventListener("click", function() {
                params.set('file', i.path);
                history.pushState('', '', '?' + params.toString());
                file_name = i.path.split('/').at(-1);
                fetch_file(i.url);
            });
        }

        tree_item.appendChild(tree_item_span);

        const tree_item_ul = document.createElement("ul");
        tree_item_ul.classList.add("nested");
        tree_item.appendChild(tree_item_ul);

        if (i.type == "tree")
        {
            if (path[0] === "")
                tree_links[path[1]] = tree_item_ul;
            else
                tree_links[path.join('/')] = tree_item_ul;
        }

        tree_links[path[0]].appendChild(tree_item);
    }

    //console.log(dir.tree)
    //fetch_file(dir.tree[47].url);
}

function parse_text(file_content)
{
    var content = "";
    const tokens = `${file_content}`.split(/(\[\/?[a-z=0-9#]+\])/i).filter(Boolean); // stolen from yagwog, thanks <3

    for (const i in tokens)
    {
        if (tokens[i] in elements)
            content += elements[tokens[i]];
        else if (tokens[i].startsWith("[color="))
            content += `<span style="color: ${tokens[i].split('=')[1].slice(0, -1)};">${tokens[i]}`
        else
            content += tokens[i];
    }
    content += "<br/>"
    return content;
}

async function fetch_file(url)
{
    const response = await fetch(url);
    const file = await response.json();

    text.innerHTML = parse_text(decode_text(file.content));
}

function rerender_text(e)
{
    text.innerHTML = parse_text(text.textContent);
}

function decode_text(encoded)
{
    // atob only can decode into ASCII, github encodes text into UTF-8. So some symbols like 
    // Taken from https://stackoverflow.com/a/64752311

    const text = atob(encoded);
    const length = text.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = text.charCodeAt(i);
    }
    const decoder = new TextDecoder(); // default is utf-8
    return decoder.decode(bytes);
}

function copy()
{
    navigator.clipboard.writeText(text.textContent);
    console.log("Copied the text!");
}

function save()
{
    // TODO, https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker#browser_compatibility

    const blob = new Blob([text.textContent], {type:'text/plain'});
    const a = document.createElement('a');

    a.href = URL.createObjectURL(blob);
    a.download = file_name;
    a.click();
}

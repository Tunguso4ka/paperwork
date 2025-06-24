// var params = new URLSearchParams(document.location.search);

const user = "crazy1112345";
const repo = "RMC14Paperwork";
const branch = "main";

var dir;

var text;
var tree;

document.addEventListener('DOMContentLoaded', function()
{
    text = document.getElementById("text");
    tree = document.getElementById("tree");

    fetch_directory(`https://api.github.com/repos/${user}/${repo}/git/trees/${branch}?recursive=1`);

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

async function fetch_file(url)
{
    const response = await fetch(url);
    var file = await response.json();

    text.textContent = `${decode_text(file.content)}`;
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
    alert("Copied the text!");
}

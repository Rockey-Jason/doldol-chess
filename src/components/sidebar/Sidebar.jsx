import "./Sidebar.css";

const botRequirement = {
    talc: 0,
    sleep: 100,
    fur: 300,
    rockey: 700,
    army: 1500,
    doronum: 3000,
    brilliant: 6000
};

export default function Sidebar({ chess = {} }) {


const {
    history = [],
    undoMove = () => {},
    resetGame = () => {},
    setBot = () => {},
    currentBot = "talc",
    rating = 0
} = chess;

    return(

        <aside className="sidebar">

            <h2>

                Choose The Bot

            </h2>

<button
    disabled={rating < botRequirement.talc}
    onClick={() => setBot("talc")}
>
talc Rockey
{
    rating < botRequirement.talc &&
    ` (⭐${botRequirement.talc})`
}
</button>

<button
    disabled={rating < botRequirement.sleep}
    onClick={() => setBot("sleep")}
>
Sleeping Rockey
{
    rating < botRequirement.sleep &&
    ` (⭐${botRequirement.sleep})`
}
</button>

<button
    disabled={rating < botRequirement.fur}
    onClick={() => setBot("fur")}
>
Rockey's Fur
{
    rating < botRequirement.fur &&
    ` (⭐${botRequirement.fur})`
}
</button>

<button
    disabled={rating < botRequirement.rockey}
    onClick={() => setBot("rockey")}
>
Rockey
{
    rating < botRequirement.rockey &&
    ` (⭐${botRequirement.rockey})`
}
</button>

<button
    disabled={rating < botRequirement.army}
    onClick={() => setBot("army")}
>
Rockey Army
{
    rating < botRequirement.army &&
    ` (⭐${botRequirement.army})`
}
</button>

<button
    disabled={rating < botRequirement.doronum}
    onClick={() => setBot("doronum")}
>
Doronum
{
    rating < botRequirement.doronum &&
    ` (⭐${botRequirement.doronum})`
}
</button>

<button
    disabled={rating < botRequirement.brilliant}
    onClick={() => setBot("brilliant")}
>
Brilliant Rockey
{
    rating < botRequirement.brilliant &&
    ` (⭐${botRequirement.brilliant})`
}
</button>
            <hr />

<button

    onClick={undoMove}

>

↩ 되돌리기

</button>
<button onClick={resetGame}>

Reset

</button>
            <hr />

<h3>기보</h3>

<div className="history">

    {history.map((move,index)=>(

        <div key={index}>

            {index+1}. {move}

        </div>

    ))}

</div>

        </aside>
        

    );

}
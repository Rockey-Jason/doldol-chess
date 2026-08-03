import "./Piece.css";

function Piece({

    piece,

    draggable,

    onDragStart

}) {

    if (!piece) return null;

    return (

        <img

            className="piece"

            src={`/pieces/${piece}.png`}

            alt={piece}

            draggable={draggable}

            onDragStart={onDragStart}

        />

    );

}

export default Piece;
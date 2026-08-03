import "./TopBar.css";

export default function TopBar({ chess = {} }){

    const {
        rating = 0,
        ratingChange = 0,
        showRatingChange = false,
    } = chess;

    return(
        <header className="topBar">
            <div className="logo">
                ♟ Rockey Chess
            </div>

            <div className="topRight">
                <div className="ratingArea">
                    <div className="rating">
                        ⭐ {rating}
                    </div>

                    {
                        showRatingChange &&
                        <div
                            className={
                                ratingChange >= 0
                                    ? "ratingUp"
                                    : "ratingDown"
                            }
                        >
                            {
                                ratingChange >= 0
                                    ? `+${ratingChange}`
                                    : ratingChange
                            }
                        </div>
                    }
                </div>
            </div>
        </header>
    );
}
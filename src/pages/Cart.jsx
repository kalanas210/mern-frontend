import React, {useEffect, useState} from 'react';
import {useAppContext} from "../context/AppContext.jsx";
import {assets} from "../assets/assets.js";
import toast from "react-hot-toast";

const Cart = () => {
    const [showAddress, setShowAddress] = useState(false);
    const {
        products,
        currency,
        cartItems,
        removeFromCart,
        getCartCount,
        updateCartItems,
        navigate,
        getCartAmount,
        axios,
        user,
        setCartItems
    } = useAppContext();

    const [cartArray, setCartArray] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentOption, setPaymentOption] = useState("COD");
    const [isLoading, setIsLoading] = useState(true);

    const getCart = () => {
        try {
            let tempArray = [];
            // Check if cartItems and products exist before processing
            if (cartItems && products && products.length > 0) {
                for (const key in cartItems) {
                    if (cartItems[key] > 0) {
                        const product = products.find((item) => item._id === key);
                        if (product) {
                            product.quantity = cartItems[key];
                            tempArray.push({...product}); // Create a copy of product to avoid reference issues
                        }
                    }
                }
            }
            setCartArray(tempArray);
            setIsLoading(false);
        } catch (error) {
            console.error("Error in getCart:", error);
            setIsLoading(false);
        }
    };

    const getUserAddress = async () => {
        try {
            const {data} = await axios.get('/api/address/get');
            if (data.success) {
                setAddresses(data.addresses || []);
                if (data.addresses && data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0]);
                }
            } else {
                toast.error(data.message || "Failed to get addresses");
            }
        } catch (error) {
            console.error("Error fetching addresses:", error);
            toast.error(error.message || "Something went wrong");
        }
    };

    const handleRemoveFromCart = (productId) => {
        try {
            // Call the removeFromCart function from context
            removeFromCart(productId);

            // Update the local cartArray state to reflect the change immediately
            setCartArray(prev => prev.filter(item => item._id !== productId));
        } catch (error) {
            console.error("Error removing item from cart:", error);
            toast.error("Failed to remove item");
        }
    };

    const placeOrder = async () => {
        try {
            if (!selectedAddress) {
                return toast.error("Please, select your address");
            }

            if (!user) {
                return toast.error("Please log in to place an order");
            }

            // Check if cartArray is empty
            if (cartArray.length === 0) {
                return toast.error("Your cart is empty");
            }

            // Check if user._id exists
            if (!user._id) {
                return toast.error("User information is incomplete");
            }

            //place order with COD
            if (paymentOption === "COD") {
                const {data} = await axios.post('/api/order/cod', {
                    userId: user._id,
                    items: cartArray.map(item => ({product: item._id, quantity: item.quantity})),
                    address: selectedAddress._id
                });

                if (data.success) {
                    toast.success(data.message || "Order placed successfully");
                    setCartItems({});
                    navigate('/my-orders');
                } else {
                    toast.error(data.message || "Failed to place order");
                }
            } else {
                const {data} = await axios.post('/api/order/stripe', {
                    userId: user._id,
                    items: cartArray.map(item => ({product: item._id, quantity: item.quantity})),
                    address: selectedAddress._id
                });

                if (data.success) {
                    window.location.replace(data.url);
                    toast.success(data.message || "Redirecting to payment");
                } else {
                    toast.error(data.message || "Failed to initialize payment");
                }
            }
        } catch (error) {
            console.error("Error placing order:", error);
            toast.error(error.message || "Failed to place order");
        }
    };

    useEffect(() => {
        // Only attempt to get cart if products are available
        if (products && products.length > 0) {
            getCart();
        }
    }, [products, cartItems,getCart]);

    useEffect(() => {
        if (user) {
            getUserAddress();
        }
    }, [user,getUserAddress]);

    // Show loading state while initializing
    if (isLoading) {
        return (
            <div className="mt-16 flex justify-center items-center h-[60vh]">
                <p>Loading your cart...</p>
            </div>
        );
    }

    return (
        <div className="mt-16">
            {cartArray && cartArray.length > 0 ? (
                <div className="flex flex-col md:flex-row">
                    <div className='flex-1 max-w-4xl'>
                        <h1 className="text-3xl font-medium mb-6">
                            Shopping Cart <span className="text-sm text-primary">{getCartCount()} Items</span>
                        </h1>

                        <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                            <p className="text-left">Product Details</p>
                            <p className="text-center">Subtotal</p>
                            <p className="text-center">Action</p>
                        </div>

                        {cartArray.map((product, index) => (
                            <div key={index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                                <div className="flex items-center md:gap-6 gap-3">
                                    <div
                                        onClick={() => {
                                            navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
                                            window.scrollTo(0, 0);
                                        }}
                                        className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded"
                                    >
                                        <img
                                            className="max-w-full h-full object-cover"
                                            src={product.image && product.image[0] ? product.image[0] : "/placeholder.png"}
                                            alt={product.name || "Product"}
                                        />
                                    </div>
                                    <div>
                                        <p className="hidden md:block font-semibold">{product.name || "Product"}</p>
                                        <div className="font-normal text-gray-500/70">
                                            <p>Weight: <span>{product.weight || "N/A"}</span></p>
                                            <div className='flex items-center'>
                                                <p>Qty:</p>
                                                <select
                                                    value={product.quantity || 1}
                                                    onChange={(e) => updateCartItems(product._id, parseInt(e.target.value))}
                                                    className='outline-none'
                                                >
                                                    {Array(Math.max(product.quantity || 1, 9)).fill('').map((_, idx) => (
                                                        <option key={idx} value={idx + 1}>{idx + 1}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center">{currency}{(product.offerPrice || 0) * (product.quantity || 1)}</p>
                                <button
                                    onClick={() => handleRemoveFromCart(product._id)}
                                    className="cursor-pointer mx-auto"
                                >
                                    <img
                                        src={assets?.remove_icon || "/remove-icon.png"}
                                        alt='remove icon'
                                        className='inline-block w-6 h-6'
                                    />
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={() => {
                                navigate('/products');
                                window.scrollTo(0, 0);
                            }}
                            className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium"
                        >
                            <img
                                src={assets?.arrow_right_icon_colored || "/arrow-right.png"}
                                alt='arrow_right'
                                className='group-hover:translate-x-1 transition'
                            />
                            Continue Shopping
                        </button>
                    </div>

                    <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
                        <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                        <hr className="border-gray-300 my-5" />

                        <div className="mb-6">
                            <p className="text-sm font-medium uppercase">Delivery Address</p>
                            <div className="relative flex justify-between items-start mt-2">
                                <p className="text-gray-500">
                                    {selectedAddress ?
                                        `${selectedAddress.street || ''}, ${selectedAddress.city || ''}, ${selectedAddress.state || ''}, ${selectedAddress.country || ''}`
                                        : 'No address found'
                                    }
                                </p>
                                <button
                                    onClick={() => setShowAddress(!showAddress)}
                                    className="text-primary hover:underline cursor-pointer"
                                >
                                    Change
                                </button>
                                {showAddress && (
                                    <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full z-10">
                                        {addresses.length > 0 ? addresses.map((address, idx) => (
                                            <p
                                                key={idx}
                                                onClick={() => {
                                                    setSelectedAddress(address);
                                                    setShowAddress(false);
                                                }}
                                                className="text-gray-500 p-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {`${address.street || ''}, ${address.city || ''}, ${address.state || ''}, ${address.country || ''}`}
                                            </p>
                                        )) : (
                                            <p className="text-gray-500 p-2">No addresses found</p>
                                        )}
                                        <p
                                            onClick={() => navigate('/add-address')}
                                            className="text-primary text-center cursor-pointer p-2 hover:bg-primary/10"
                                        >
                                            Add address
                                        </p>
                                    </div>
                                )}
                            </div>

                            <p className="text-sm font-medium uppercase mt-6">Payment Method</p>

                            <select
                                onChange={e => setPaymentOption(e.target.value)}
                                value={paymentOption}
                                className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none"
                            >
                                <option value="COD">Cash On Delivery</option>
                                <option value="Online">Online Payment</option>
                            </select>
                        </div>

                        <hr className="border-gray-300" />

                        <div className="text-gray-500 mt-4 space-y-2">
                            <p className="flex justify-between">
                                <span>Price</span><span>{currency}{getCartAmount()}</span>
                            </p>
                            <p className="flex justify-between">
                                <span>Shipping Fee</span><span className="text-green-600">Free</span>
                            </p>
                            <p className="flex justify-between">
                                <span>Tax (2%)</span><span>{currency}{(getCartAmount() * 0.02).toFixed(2)}</span>
                            </p>
                            <p className="flex justify-between text-lg font-medium mt-3">
                                <span>Total Amount:</span><span>{currency}{(getCartAmount() + getCartAmount() * 0.02).toFixed(2)}</span>
                            </p>
                        </div>

                        <button
                            onClick={placeOrder}
                            className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition"
                        >
                            {paymentOption === 'COD' ? 'Place Order' : 'Proceed To Checkout'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <p className="text-2xl font-medium text-primary">Your Cart is Empty</p>
                    <button
                        onClick={() => {
                            navigate('/products');
                            window.scrollTo(0, 0);
                        }}
                        className="mt-4 px-6 py-2 bg-primary text-white rounded hover:bg-primary-dull"
                    >
                        Continue Shopping
                    </button>
                </div>
            )}
        </div>
    );
};

export default Cart;
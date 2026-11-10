export const verifyUser = async (req, res, next) => {
  try {
    const cookie = req.headers.cookie

    if (!cookie) {
      return res.status(401).json({
        success: false,
        message: 'Please login first.',
      })
    }

    const response = await fetch(
      `${process.env.BETTER_AUTH_URL}/api/auth/get-session`,
      {
        method: 'GET',
        headers: {
          cookie,
        },
      },
    )

    if (!response.ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session.',
      })
    }

    const data = await response.json()

    if (!data?.user?.id || !data?.session) {
      return res.status(401).json({
        success: false,
        message: 'Please login first.',
      })
    }

    req.user = data.user
    req.session = data.session

    next()
  } catch (error) {
    console.error('Authentication error:', error)

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    })
  }
}

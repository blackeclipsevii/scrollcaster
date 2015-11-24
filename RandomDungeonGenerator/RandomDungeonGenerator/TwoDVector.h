#include <vector>
#include <iostream>

/*
* Never flat!
*/
template <class T> 
class TwoDVector
{
private:
	std::vector<T> vex;
	unsigned int mWidth, mHeight;
public:
	/**********************************************/
	/*****************MANIPULATE*******************/
	/**********************************************/
	void fill(const T &item, const unsigned int &width, const unsigned int &height)
	{
		mWidth = width, mHeight = height;
		const unsigned int size = mWidth * mHeight;
		for (unsigned int i = 0; i < size; i++)
			vex.push_back(item);
	}

	void push_back(const T &item)
	{ vex.push_back(item); }

	void erase(const unsigned int &x, const unsigned int &y)
	{ vex.erase(x + (y * mWidth)) }

	void replace(const unsigned int &absPos, const T &item)
	{ vex.at(absPos) = item; }

	void clear()
	{ vex.clear(); }

	/**********************************************/
	/*******************ACCESS*********************/
	/**********************************************/
	T at(const unsigned int &x, const unsigned int &y)
	{ return vex.at(x + (y * mWidth)); }

	int getX(const unsigned int &absolutePosition)
	{ return absolutePosition % mWidth; }

	int getY(const unsigned int &absolutePosition)
	{ return absolutePosition / mWidth; }

	T at(const unsigned int &absPos)
	{ return vex.at(absPos); }

	int size()
	{ return vex.size(); }

	int width()
	{ return mWidth; }

	int height()
	{ return mHeight; }

	void print()
	{
		unsigned int position = 0;
		for (unsigned int i = 0; i < mHeight; i++)
		{
			for (unsigned int j = 0; j < mWidth; j++)
			{
				std::cout << vex.at(position);
				position++;
			}
			std::cout << "\n";
		}
	}
};


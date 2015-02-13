#pragma once
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
	int w, h;
public:
	/**********************************************/
	/*****************MANIPULATE*******************/
	/**********************************************/
	void fill(T item, int width, int height)
	{
		w = width;
		h = height;
		for (int i = 0; i < (w * h); i++)
		{
			vex.push_back(item);
		}
	}

	void push_back(T item)
	{
		vex.push_back(item);
	}

	void erase(int x, int y)
	{
		vex.erase(x + (y * w))
	}

	void replace(int absPos, T item)
	{
		vex.at(absPos) = item;
	}

	void clear()
	{
		vex.clear();
	}

	/**********************************************/
	/*******************ACCESS*********************/
	/**********************************************/
	T at(int x, int y)
	{
		return vex.at(x + (y * w));
	}

	int getX(int absolutePosition)
	{
		return absolutePosition % w;
	}

	int getY(int absolutePosition)
	{
		return absolutePosition / w;
	}

	T at(int absPos)
	{
		return vex.at(absPos);
	}

	int size()
	{
		return vex.size();
	}

	int width()
	{
		return w;
	}

	int height()
	{
		return h;
	}

	void print()
	{
		int position = 0;
		for (int i = 0; i < h; i++)
		{
			for (int j = 0; j < w; j++)
			{
				std::cout << vex.at(position);
				position++;
			}
			std::cout << "\n";
		}
	}
};

